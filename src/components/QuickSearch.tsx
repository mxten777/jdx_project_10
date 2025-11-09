import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch, type SearchResult } from '../hooks/useSearch';
import { cn } from '../utils/cn';

interface QuickSearchProps {
  onSelect?: (result: SearchResult | string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  onSelect,
  placeholder = "검색...",
  className,
  compact = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    results,
    suggestions,
    isSearching,
    recentSearches,
    debouncedSearch,
    getSuggestions
  } = useSearch();

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    setIsOpen(true);
    
    if (value.trim()) {
      getSuggestions(value);
      debouncedSearch({ searchQuery: value }, 150);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = Math.max(results.length, suggestions.length, recentSearches.length);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const item = results[selectedIndex] || suggestions[selectedIndex] || recentSearches[selectedIndex];
          if (item) {
            handleSelect(typeof item === 'string' ? item : item);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle item selection
  const handleSelect = (item: SearchResult | string) => {
    if (typeof item === 'string') {
      setQuery(item);
      handleInputChange(item);
    } else {
      onSelect?.(item);
      setQuery('');
      setIsOpen(false);
    }
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "w-full pl-10 pr-4 border border-gray-200 rounded-xl",
            "bg-white/80 backdrop-blur-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "placeholder-gray-400 text-gray-900",
            "transition-all duration-200",
            compact ? "py-2 text-sm" : "py-3 text-base"
          )}
        />

        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <motion.div
              className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* Clear button */}
        {query && !isSearching && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || recentSearches.length > 0) && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-80 overflow-y-auto"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  검색 결과
                </div>
                {results.slice(0, 5).map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0",
                      index === selectedIndex && "bg-primary-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.imageUrls?.[0] && (
                        <img
                          src={result.imageUrls[0]}
                          alt=""
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-medium text-gray-900 text-sm line-clamp-1"
                          dangerouslySetInnerHTML={{ 
                            __html: result.highlightedTitle || result.title 
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {result.authorName} • {result.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {query && suggestions.length > 0 && (
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  추천 검색어
                </div>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    onClick={() => handleSelect(suggestion.value)}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-gray-50 text-sm",
                      index + results.length === selectedIndex && "bg-primary-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-700">{suggestion.value}</span>
                      <span className="text-xs text-gray-400 ml-auto">({suggestion.count})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  최근 검색
                </div>
                {recentSearches.slice(0, 5).map((recent, index) => (
                  <button
                    key={recent}
                    onClick={() => handleSelect(recent)}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-gray-50 text-sm",
                      index === selectedIndex && "bg-primary-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{recent}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && !isSearching && results.length === 0 && suggestions.length === 0 && (
              <div className="py-8 text-center">
                <div className="text-gray-400 text-sm">검색 결과가 없습니다</div>
              </div>
            )}

            {/* Keyboard Shortcut Hint */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>⌘K로 빠른 검색</span>
                <div className="flex items-center gap-2">
                  <span>↑↓ 탐색</span>
                  <span>↵ 선택</span>
                  <span>ESC 닫기</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickSearch;