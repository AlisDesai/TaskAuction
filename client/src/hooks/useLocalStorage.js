// client/src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback } from "react";

// Custom hook for localStorage with React state synchronization
export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validator = null,
    syncAcrossTabs = true,
    onError = console.error,
  } = options;

  // Get initial value from localStorage or use provided initial value
  const getInitialValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const deserializedValue = deserialize(item);

        // Validate the value if validator is provided
        if (validator && !validator(deserializedValue)) {
          console.warn(`Invalid value for key "${key}", using initial value`);
          return initialValue;
        }

        return deserializedValue;
      }
      return initialValue;
    } catch (error) {
      onError(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize, validator, onError]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  // Set value in both state and localStorage
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function for same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Validate the value if validator is provided
        if (validator && !validator(valueToStore)) {
          throw new Error(`Invalid value for key "${key}"`);
        }

        setStoredValue(valueToStore);

        // Save to localStorage
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serialize(valueToStore));
        }

        // Dispatch custom event for cross-tab synchronization
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent("localStorage", {
              detail: { key, newValue: valueToStore },
            })
          );
        }
      } catch (error) {
        onError(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serialize, validator, syncAcrossTabs, onError]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(undefined);
      window.localStorage.removeItem(key);

      // Dispatch custom event for cross-tab synchronization
      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent("localStorage", {
            detail: { key, newValue: undefined },
          })
        );
      }
    } catch (error) {
      onError(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, syncAcrossTabs, onError]);

  // Listen for changes in localStorage (for cross-tab synchronization)
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? deserialize(e.newValue) : undefined;

          // Validate the value if validator is provided
          if (newValue !== undefined && validator && !validator(newValue)) {
            console.warn(
              `Invalid value received for key "${key}" from localStorage event`
            );
            return;
          }

          setStoredValue(newValue);
        } catch (error) {
          onError(`Error parsing localStorage event for key "${key}":`, error);
        }
      }
    };

    const handleCustomStorageChange = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    // Listen for both native storage events and custom events
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorage", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorage", handleCustomStorageChange);
    };
  }, [key, deserialize, validator, syncAcrossTabs, onError]);

  // Refresh value from localStorage
  const refreshValue = useCallback(() => {
    setStoredValue(getInitialValue());
  }, [getInitialValue]);

  return [storedValue, setValue, removeValue, refreshValue];
};

// Hook for managing multiple localStorage keys as an object
export const useLocalStorageState = (keys, initialState = {}) => {
  const [state, setState] = useState(() => {
    const savedState = {};
    Object.keys(keys).forEach((key) => {
      try {
        const item = window.localStorage.getItem(keys[key]);
        if (item !== null) {
          savedState[key] = JSON.parse(item);
        } else {
          savedState[key] = initialState[key];
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${keys[key]}":`, error);
        savedState[key] = initialState[key];
      }
    });
    return savedState;
  });

  const updateState = useCallback(
    (updates) => {
      setState((prevState) => {
        const newState = { ...prevState, ...updates };

        // Save individual keys to localStorage
        Object.keys(updates).forEach((key) => {
          try {
            if (keys[key]) {
              if (newState[key] === undefined) {
                window.localStorage.removeItem(keys[key]);
              } else {
                window.localStorage.setItem(
                  keys[key],
                  JSON.stringify(newState[key])
                );
              }
            }
          } catch (error) {
            console.error(
              `Error saving to localStorage key "${keys[key]}":`,
              error
            );
          }
        });

        return newState;
      });
    },
    [keys]
  );

  const resetState = useCallback(() => {
    Object.values(keys).forEach((storageKey) => {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(
          `Error removing localStorage key "${storageKey}":`,
          error
        );
      }
    });
    setState(initialState);
  }, [keys, initialState]);

  return [state, updateState, resetState];
};

// Hook for localStorage with expiration
export const useLocalStorageWithExpiry = (
  key,
  initialValue,
  ttlMinutes = 60
) => {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue, {
    serialize: (value) =>
      JSON.stringify({
        value,
        expiry: new Date().getTime() + ttlMinutes * 60 * 1000,
      }),
    deserialize: (item) => {
      const parsed = JSON.parse(item);
      if (new Date().getTime() > parsed.expiry) {
        // Value has expired
        window.localStorage.removeItem(key);
        return null;
      }
      return parsed.value;
    },
  });

  const setValueWithExpiry = useCallback(
    (newValue, customTtlMinutes) => {
      const ttl = customTtlMinutes || ttlMinutes;
      setValue(newValue);
    },
    [setValue, ttlMinutes]
  );

  return [value, setValueWithExpiry, removeValue];
};

// Hook for user preferences with localStorage persistence
export const useUserPreferences = (defaultPreferences = {}) => {
  const [preferences, setPreferences] = useLocalStorage(
    "userPreferences",
    defaultPreferences,
    {
      validator: (value) => typeof value === "object" && value !== null,
    }
  );

  const updatePreference = useCallback(
    (key, value) => {
      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setPreferences]
  );

  const updatePreferences = useCallback(
    (updates) => {
      setPreferences((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setPreferences]
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  const getPreference = useCallback(
    (key, fallback = null) => {
      return preferences?.[key] ?? fallback;
    },
    [preferences]
  );

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    getPreference,
  };
};

// Hook for form data persistence
export const useFormPersistence = (formKey, initialData = {}) => {
  const [formData, setFormData] = useLocalStorage(
    `form_${formKey}`,
    initialData
  );

  const updateField = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setFormData]
  );

  const updateFields = useCallback(
    (updates) => {
      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setFormData]
  );

  const clearForm = useCallback(() => {
    setFormData(initialData);
  }, [setFormData, initialData]);

  const resetField = useCallback(
    (field) => {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[field];
        return newData;
      });
    },
    [setFormData]
  );

  return {
    formData,
    updateField,
    updateFields,
    clearForm,
    resetField,
  };
};

// Hook for recent searches/history
export const useSearchHistory = (maxItems = 10) => {
  const [searchHistory, setSearchHistory] = useLocalStorage(
    "searchHistory",
    []
  );

  const addSearch = useCallback(
    (searchTerm) => {
      if (!searchTerm || typeof searchTerm !== "string") return;

      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item !== searchTerm);
        return [searchTerm, ...filtered].slice(0, maxItems);
      });
    },
    [setSearchHistory, maxItems]
  );

  const removeSearch = useCallback(
    (searchTerm) => {
      setSearchHistory((prev) => prev.filter((item) => item !== searchTerm));
    },
    [setSearchHistory]
  );

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  return {
    searchHistory,
    addSearch,
    removeSearch,
    clearHistory,
  };
};

// Hook for recently viewed items
export const useRecentlyViewed = (key, maxItems = 20) => {
  const [recentItems, setRecentItems] = useLocalStorage(`recent_${key}`, []);

  const addItem = useCallback(
    (item) => {
      if (!item || !item.id) return;

      setRecentItems((prev) => {
        const filtered = prev.filter((recentItem) => recentItem.id !== item.id);
        const newItem = {
          ...item,
          viewedAt: new Date().toISOString(),
        };
        return [newItem, ...filtered].slice(0, maxItems);
      });
    },
    [setRecentItems, maxItems]
  );

  const removeItem = useCallback(
    (itemId) => {
      setRecentItems((prev) => prev.filter((item) => item.id !== itemId));
    },
    [setRecentItems]
  );

  const clearItems = useCallback(() => {
    setRecentItems([]);
  }, [setRecentItems]);

  const getRecentItems = useCallback(
    (limit) => {
      return limit ? recentItems.slice(0, limit) : recentItems;
    },
    [recentItems]
  );

  return {
    recentItems,
    addItem,
    removeItem,
    clearItems,
    getRecentItems,
  };
};

// Hook for managing draft content
export const useDraftContent = (contentKey) => {
  const [draft, setDraft] = useLocalStorage(`draft_${contentKey}`, null);
  const [lastSaved, setLastSaved] = useLocalStorage(
    `draft_${contentKey}_timestamp`,
    null
  );

  const saveDraft = useCallback(
    (content) => {
      setDraft(content);
      setLastSaved(new Date().toISOString());
    },
    [setDraft, setLastSaved]
  );

  const clearDraft = useCallback(() => {
    setDraft(null);
    setLastSaved(null);
  }, [setDraft, setLastSaved]);

  const hasDraft = useCallback(() => {
    return draft !== null && draft !== undefined;
  }, [draft]);

  const getDraftAge = useCallback(() => {
    if (!lastSaved) return null;

    const now = new Date();
    const savedTime = new Date(lastSaved);
    const diffInMinutes = Math.floor((now - savedTime) / (1000 * 60));

    return diffInMinutes;
  }, [lastSaved]);

  const isDraftStale = useCallback(
    (staleAfterMinutes = 60) => {
      const age = getDraftAge();
      return age !== null && age > staleAfterMinutes;
    },
    [getDraftAge]
  );

  return {
    draft,
    lastSaved,
    saveDraft,
    clearDraft,
    hasDraft,
    getDraftAge,
    isDraftStale,
  };
};

// Hook for localStorage quota management
export const useLocalStorageQuota = () => {
  const [quotaInfo, setQuotaInfo] = useState({
    used: 0,
    available: 0,
    total: 0,
    percentage: 0,
  });

  const checkQuota = useCallback(() => {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate total quota (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const available = total - used;
      const percentage = (used / total) * 100;

      setQuotaInfo({
        used,
        available,
        total,
        percentage: Math.round(percentage * 100) / 100,
      });

      return { used, available, total, percentage };
    } catch (error) {
      console.error("Error checking localStorage quota:", error);
      return null;
    }
  }, []);

  const isQuotaExceeded = useCallback(() => {
    return quotaInfo.percentage > 90;
  }, [quotaInfo.percentage]);

  const clearOldData = useCallback(
    (pattern = null, maxAge = 7) => {
      try {
        const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const now = new Date().getTime();

        const keysToRemove = [];

        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            if (pattern && !key.includes(pattern)) continue;

            try {
              const item = JSON.parse(localStorage[key]);
              if (item.timestamp && now - item.timestamp > maxAgeMs) {
                keysToRemove.push(key);
              }
            } catch {
              // Not a timestamped item, skip
            }
          }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
        checkQuota();

        return keysToRemove.length;
      } catch (error) {
        console.error("Error clearing old localStorage data:", error);
        return 0;
      }
    },
    [checkQuota]
  );

  useEffect(() => {
    checkQuota();
  }, [checkQuota]);

  return {
    quotaInfo,
    checkQuota,
    isQuotaExceeded,
    clearOldData,
  };
};

// Hook for theme persistence
export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage("theme", "light", {
    validator: (value) => ["light", "dark", "system"].includes(value),
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, [setTheme]);

  const setLightTheme = useCallback(() => {
    setTheme("light");
  }, [setTheme]);

  const setDarkTheme = useCallback(() => {
    setTheme("dark");
  }, [setTheme]);

  const setSystemTheme = useCallback(() => {
    setTheme("system");
  }, [setTheme]);

  // Get effective theme (resolve 'system' to actual theme)
  const getEffectiveTheme = useCallback(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  return {
    theme,
    effectiveTheme: getEffectiveTheme(),
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  };
};

// Hook for saving and restoring scroll position
export const useScrollPosition = (key) => {
  const [scrollPosition, setScrollPosition] = useLocalStorage(
    `scroll_${key}`,
    0
  );

  const saveScrollPosition = useCallback(() => {
    const position = window.pageYOffset || document.documentElement.scrollTop;
    setScrollPosition(position);
  }, [setScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (scrollPosition > 0) {
      window.scrollTo(0, scrollPosition);
    }
  }, [scrollPosition]);

  const clearScrollPosition = useCallback(() => {
    setScrollPosition(0);
  }, [setScrollPosition]);

  return {
    scrollPosition,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
};

export default useLocalStorage;
