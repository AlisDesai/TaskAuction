// client/src/components/Layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Heart,
  ExternalLink,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: "Browse Tasks", href: "/tasks" },
      { name: "How It Works", href: "/how-it-works" },
      { name: "Categories", href: "/categories" },
      { name: "Success Stories", href: "/success-stories" },
    ],
    forStudents: [
      { name: "Find Tasks", href: "/tasks" },
      { name: "Post a Task", href: "/tasks/create" },
      { name: "Earn Money", href: "/earn" },
      { name: "Build Skills", href: "/skills" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Safety Guidelines", href: "/safety" },
      { name: "Contact Us", href: "/contact" },
      { name: "Report Issue", href: "/report" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Community Guidelines", href: "/guidelines" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#", color: "hover:text-blue-400" },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "#",
      color: "hover:text-blue-600",
    },
    { name: "GitHub", icon: Github, href: "#", color: "hover:text-gray-900" },
  ];

  const contactInfo = [
    {
      icon: Mail,
      text: "support@taskauction.com",
      href: "mailto:support@taskauction.com",
    },
    { icon: Phone, text: "+91 9876543210", href: "tel:+919876543210" },
    { icon: MapPin, text: "Vadodara, Gujarat, India", href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-white">TaskAuction</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Connecting students for tasks and services through a simple
              bidding system. Build skills, earn money, and help your campus
              community.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{item.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Students</h3>
            <ul className="space-y-3">
              {footerLinks.forStudents.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-400 text-sm">
                Get the latest updates about new features and campus
                opportunities.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Copyright */}
            <div className="flex items-center space-x-1 text-gray-400 text-sm mb-4 md:mb-0">
              <span>© {currentYear} TaskAuction. Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for students.</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`text-gray-400 ${social.color} transition-colors duration-200`}
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Stats Section */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-white font-semibold mb-6">
              Growing Campus Community
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-400 mb-1">
                  500+
                </div>
                <div className="text-gray-400 text-sm">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-400 mb-1">
                  1,200+
                </div>
                <div className="text-gray-400 text-sm">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-400 mb-1">
                  50+
                </div>
                <div className="text-gray-400 text-sm">Colleges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-400 mb-1">
                  ₹2L+
                </div>
                <div className="text-gray-400 text-sm">Earned by Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Mobile */}
      <div className="md:hidden bg-gray-800 border-t border-gray-700">
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/tasks"
              className="flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <span className="text-sm font-medium">Find Tasks</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              to="/tasks/create"
              className="flex items-center justify-center space-x-2 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <span className="text-sm font-medium">Post Task</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
