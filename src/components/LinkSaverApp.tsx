'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Plus, Trash2, Search, Moon, Sun, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface User {
  id: number;
  email: string;
}

interface Bookmark {
  id: number;
  url: string;
  title: string;
  favicon: string;
  summary: string;
  userId: number;
  createdAt: string;
}

// API functions
const api = {
  async register(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { error: 'Network error' };
    }
  },
  
  async login(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error' };
    }
  },
  
  async fetchMetadata(url: string) {
    try {
      const domain = new URL(url).hostname;
      return {
        title: `Page from ${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      };
    } catch {
      return { title: 'Unknown Page', favicon: '/favicon.ico' };
    }
  },
  
  async getSummary(url: string) {
    try {
      // Remove the protocol from the URL for Jina AI
      let cleanUrl = url;
      if (url.startsWith('https://')) {
        cleanUrl = url.substring(8);
      } else if (url.startsWith('http://')) {
        cleanUrl = url.substring(7);
      }
      
      // Encode the URL
      const encodedUrl = encodeURIComponent(cleanUrl);
      
      // Call Jina AI endpoint
      const response = await fetch(`https://r.jina.ai/${encodedUrl}`);
      
      if (response.ok) {
        const content = await response.text();
        
        // Try to find the first meaningful sentence
        // Split by newlines and filter out metadata
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => {
            // Skip metadata lines
            if (line.toLowerCase().includes('title:')) return false;
            if (line.toLowerCase().includes('url source:')) return false;
            if (line.toLowerCase().includes('markdown content:')) return false;
            if (line.includes('===') || line.includes('---')) return false;
            if (line.startsWith('![')) return false;
            if (line.startsWith('#')) return false;
            if (line.length < 20) return false;
            // Skip navigation/footer text
            if (line.includes('©') || line.includes('Sign Up') || line.includes('Log In')) return false;
            return true;
          });
        
        // Get the first meaningful line
        if (lines.length > 0) {
          // Clean up markdown formatting
          let summary = lines[0]
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
            .replace(/[*_~`#]/g, '') // Remove markdown symbols
            .trim();
          
          // Ensure it ends with a period
          if (summary && !summary.endsWith('.')) {
            summary += '.';
          }
          
          return summary || 'No description available.';
        }
        
        return 'No description available.';
      }
      
      return 'Summary temporarily unavailable.';
    } catch (error) {
      console.error('Error fetching summary:', error);
      return 'Summary temporarily unavailable.';
    }
  },
  
  async saveBookmark(url: string, userId: number, token: string) {
    const metadata = await this.fetchMetadata(url);
    const summary = await this.getSummary(url);
    
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url,
          title: metadata.title,
          favicon: metadata.favicon,
          summary
        })
      });
      
      if (!response.ok) throw new Error('Failed to save bookmark');
      
      const bookmark = await response.json();
      return bookmark;
    } catch (error) {
      console.error('Error saving bookmark:', error);
      throw error;
    }
  },
  
  async getBookmarks(userId: number, token: string): Promise<Bookmark[]> {
    try {
      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      
      const bookmarks = await response.json();
      return bookmarks;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  },
  
  async deleteBookmark(id: number, token: string) {
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete bookmark');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      return { success: false };
    }
  }
};

const AuthForm: React.FC<{ onLogin: (user: User, token: string) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await api.login(email, password);
        if (result.success && result.user) {
          onLogin(result.user, result.token);
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        const result = await api.register(email, password);
        if (result.success && result.user) {
          onLogin(result.user, result.token);
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Link Saver
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Save and summarize your favorite links
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              <strong>Demo Credentials:</strong><br />
              Email: test@example.com<br />
              Password: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookmarkCard: React.FC<{
  bookmark: Bookmark;
  onDelete: (id: number) => void;
}> = ({ bookmark, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {!imageError ? (
            <Image
              src={bookmark.favicon}
              alt=""
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0 flex items-center justify-center">
              <ExternalLink size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg mb-1">
              {bookmark.title}
            </h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate block hover:underline"
            >
              {bookmark.url}
            </a>
          </div>
        </div>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete bookmark"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
        {bookmark.summary}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Saved {new Date(bookmark.createdAt).toLocaleDateString()}</span>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
        >
          Visit <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  user: User;
  token: string;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}> = ({ user, token, onLogout, darkMode, setDarkMode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadBookmarks = useCallback(async () => {
    const userBookmarks = await api.getBookmarks(user.id, token);
    setBookmarks(userBookmarks);
  }, [user.id, token]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleAddBookmark = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUrl.trim()) return;

    setLoading(true);
    try {
      const bookmark = await api.saveBookmark(newUrl.trim(), user.id, token);
      setBookmarks(prev => [bookmark, ...prev]);
      setNewUrl('');
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
    setLoading(false);
  };

  const handleDeleteBookmark = async (id: number) => {
    await api.deleteBookmark(id, token);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ExternalLink className="text-white" size={18} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Link Saver
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                {user.email}
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle theme"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add bookmark section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus size={24} className="text-blue-600" />
            Add New Bookmark
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste any URL here... (e.g., https://news.ycombinator.com)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBookmark()}
              />
            </div>
            <button
              onClick={handleAddBookmark}
              disabled={loading || !newUrl.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        {bookmarks.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white bg-white transition-colors"
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {bookmarks.length > 0 && (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {filteredBookmarks.length === bookmarks.length ? (
              `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'} total`
            ) : (
              `${filteredBookmarks.length} of ${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`
            )}
          </div>
        )}

        {/* Bookmarks grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              {searchTerm ? <Search size={48} className="mx-auto" /> : <Plus size={48} className="mx-auto" />}
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or clear the search to see all bookmarks.' 
                : 'Start building your collection by adding your first bookmark above. We\'ll automatically fetch the title and generate a summary!'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function LinkSaverApp() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for saved theme preference (using system preference as default)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, mounted]);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  if (!user || !token) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      token={token}
      onLogout={handleLogout}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    />
  );
}