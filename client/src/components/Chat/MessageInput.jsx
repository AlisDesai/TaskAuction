// client/src/components/Chat/MessageInput.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image,
  Smile,
  X,
  AlertCircle,
  FileText,
  Film,
  Music,
} from "lucide-react";
import chatService from "../../services/chatService";

const MessageInput = ({
  onSendMessage,
  replyingTo = null,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  onTyping = null,
  maxLength = 2000,
  className = "",
}) => {
  // State
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emoji list
  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😬",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "✋",
    "🤚",
    "🖐️",
    "🖖",
    "👋",
    "🤝",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤜",
    "🤛",
    "✊",
    "👊",
    "🤦",
    "🤷",
    "💪",
    "🦾",
    "🙏",
  ];

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 120; // Max 5 lines
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;

      if (value.length <= maxLength) {
        setMessage(value);
        setError("");

        // Handle typing indicator
        if (onTyping && !disabled) {
          if (!isTyping && value.trim()) {
            setIsTyping(true);
            onTyping(true);
          }

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set new timeout to stop typing
          typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
              setIsTyping(false);
              onTyping(false);
            }
          }, 1000);
        }
      }
    },
    [maxLength, onTyping, disabled, isTyping]
  );

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (disabled) return;

    const trimmedMessage = message.trim();

    // Validate input
    if (!trimmedMessage && !attachedFile) {
      setError("Please enter a message or attach a file");
      return;
    }

    // Validate file if attached
    if (attachedFile) {
      const validation = chatService.validateMessageData(
        { content: trimmedMessage },
        attachedFile
      );
      if (!validation.isValid) {
        setError(validation.errors[0]);
        return;
      }
    }

    setIsUploading(true);
    setError("");

    try {
      const messageData = {
        content: trimmedMessage,
        type: attachedFile
          ? attachedFile.type.startsWith("image/")
            ? "image"
            : "file"
          : "text",
        replyTo: replyingTo?._id || null,
      };

      const result = await onSendMessage(messageData, attachedFile);

      if (result.success) {
        // Clear input
        setMessage("");
        setAttachedFile(null);

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }

        // Stop typing indicator
        if (isTyping && onTyping) {
          setIsTyping(false);
          onTyping(false);
        }

        // Focus back to input
        textareaRef.current?.focus();
      } else {
        setError(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setIsUploading(false);
    }
  }, [
    disabled,
    message,
    attachedFile,
    replyingTo,
    onSendMessage,
    isTyping,
    onTyping,
  ]);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size cannot exceed 10MB");
        return;
      }

      if (!chatService.isSupportedFileType(file)) {
        setError("File type not supported");
        return;
      }

      setAttachedFile(file);
      setError("");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Handle emoji selection
  const handleEmojiSelect = useCallback(
    (emoji) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newMessage = message.slice(0, start) + emoji + message.slice(end);

        if (newMessage.length <= maxLength) {
          setMessage(newMessage);

          // Set cursor position after emoji
          setTimeout(() => {
            const newPosition = start + emoji.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
          }, 0);
        }
      }

      setShowEmojiPicker(false);
    },
    [message, maxLength]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        setError("File size cannot exceed 10MB");
        return;
      }

      if (!chatService.isSupportedFileType(file)) {
        setError("File type not supported");
        return;
      }

      setAttachedFile(file);
      setError("");
    }
  }, []);

  // Remove attached file
  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null);
    setError("");
  }, []);

  // Get file icon
  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith("video/")) return <Film className="w-4 h-4" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // Auto-resize textarea when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Stop typing when component unmounts or disabled
  useEffect(() => {
    if (disabled && isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  }, [disabled, isTyping, onTyping]);

  return (
    <div className={`border-t border-gray-200 bg-white ${className}`}>
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <span>Replying to {replyingTo.sender.firstName}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-gray-600 mt-1 truncate">
            {replyingTo.content}
          </div>
        </div>
      )}

      {/* Attached file preview */}
      {attachedFile && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {getFileIcon(attachedFile.type)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {attachedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {chatService.formatFileSize(attachedFile.size)}
                </div>
              </div>
            </div>
            <button
              onClick={removeAttachedFile}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className={`relative ${dragOver ? "bg-blue-50" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center z-10">
            <div className="text-center text-blue-600">
              <Paperclip className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Drop file to attach</p>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-3 p-4">
          {/* Attachment button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          {/* Emoji button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-1 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Connecting..." : placeholder}
              disabled={disabled || isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows="1"
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />

            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div
                className={`absolute -top-6 right-0 text-xs ${
                  message.length > maxLength ? "text-red-500" : "text-gray-500"
                }`}
              >
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleSendMessage}
              disabled={
                disabled || isUploading || (!message.trim() && !attachedFile)
              }
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageInput;
