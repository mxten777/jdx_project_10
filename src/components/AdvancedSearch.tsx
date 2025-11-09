import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch, type SearchFilters } from '../hooks/useSearch';
import { useResponsive } from '../hooks/useResponsive';
import { cn } from '../utils/cn';

interface AdvancedSearchProps {
  onSelect?: (result: any) => void;
  onClose?: () => void;
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSelect,
  onClose,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useResponsive();
  
  const {
    results,
    suggestions,
    isSearching,
    recentSearches,
    popularTags,
    search,
    debouncedSearch,
    getSuggestions,
    clearRecentSearches
  } = useSearch();

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedSuggestion(-1);
    
    if (value.trim()) {
      // Get suggestions for current query
      getSuggestions(value);
      
      // Perform debounced search
      debouncedSearch({ 
        ...currentFilters, 
        searchQuery: value 
      });
    } else {
      // Clear results when query is empty
      setCurrentFilters({});
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    const newFilters = { ...currentFilters, [filterType]: value };
    setCurrentFilters(newFilters);
    
    // Perform search with new filters
    search({ ...newFilters, searchQuery });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearchChange(suggestion);
    setSelectedSuggestion(-1);
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (recentQuery: string) => {
    setSearchQuery(recentQuery);
    handleSearchChange(recentQuery);
  };

  // Handle popular tag selection
  const handleTagSelect = (tag: string) => {
    const newTags = currentFilters.tags || [];
    const updatedTags = newTags.includes(tag) 
      ? newTags.filter(t => t !== tag)
      : [...newTags, tag];
    
    handleFilterChange('tags', updatedTags);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      onClose?.();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        handleSuggestionSelect(suggestions[selectedSuggestion].value);
      }
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={cn("relative", className)}>
      {/* Search Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-2xl",
          "bg-white/80 backdrop-blur-sm border border-gray-200",
          "hover:bg-white hover:shadow-lg transition-all duration-300",
          "text-gray-500 hover:text-gray-700",
          isMobile ? "text-sm" : "text-base"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left">추억 검색...</span>
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-1 text-xs bg-gray-100 rounded border text-gray-500">
            ⌘K
          </kbd>
        </div>
      </motion.button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className={cn(
                "w-full bg-white rounded-2xl shadow-2xl overflow-hidden",
                isMobile ? "max-w-sm mt-16" : "max-w-2xl mt-24"
              )}
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="추억을 검색해보세요..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 text-lg font-medium bg-transparent border-none outline-none placeholder-gray-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn(
                        "p-2 rounded-lg hover:bg-gray-100 transition-colors",
                        showFilters && "bg-primary-100 text-primary-600"
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    className="px-6 py-4 bg-gray-50 border-b border-gray-100"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-4">
                      {/* Date Range Filter */}
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 w-20">기간</label>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="date"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onChange={(e) => {
                              const start = e.target.value ? new Date(e.target.value) : undefined;
                              handleFilterChange('dateRange', start ? { 
                                ...currentFilters.dateRange, 
                                start 
                              } : undefined);
                            }}
                          />
                          <span className="text-gray-400">~</span>
                          <input
                            type="date"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onChange={(e) => {
                              const end = e.target.value ? new Date(e.target.value) : undefined;
                              handleFilterChange('dateRange', end ? { 
                                ...currentFilters.dateRange, 
                                end 
                              } : undefined);
                            }}
                          />
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 w-20">정렬</label>
                        <select
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        >
                          <option value="createdAt">작성일순</option>
                          <option value="updatedAt">수정일순</option>
                          <option value="title">제목순</option>
                        </select>
                        <select
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        >
                          <option value="desc">내림차순</option>
                          <option value="asc">오름차순</option>
                        </select>
                      </div>

                      {/* Clear Filters */}
                      <button
                        onClick={() => {
                          setCurrentFilters({});
                          setSearchQuery('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Content */}
              <div className="max-h-96 overflow-y-auto">
                {/* Loading State */}
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-gray-500">
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>검색 중...</span>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {!isSearching && searchQuery && results.length > 0 && (
                  <div className="py-2">
                    <div className="px-6 py-2">
                      <h3 className="text-sm font-medium text-gray-500">
                        검색 결과 ({results.length}개)
                      </h3>
                    </div>
                    {results.map((result, index) => (
                      <motion.button
                        key={result.id}
                        className="w-full px-6 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        onClick={() => {
                          onSelect?.(result);
                          setIsOpen(false);
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-3">
                          {result.imageUrls?.[0] && (
                            <img
                              src={result.imageUrls[0]}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 
                              className="font-medium text-gray-900 mb-1 line-clamp-1"
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlightedTitle || result.title 
                              }}
                            />
                            <p 
                              className="text-sm text-gray-600 mb-2 line-clamp-2"
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlightedContent || result.content 
                              }}
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{result.authorName}</span>
                              <span>•</span>
                              <span>{result.createdAt.toDate().toLocaleDateString()}</span>
                              {result.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex gap-1">
                                    {result.tags.slice(0, 2).map(tag => (
                                      <span key={tag} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!isSearching && searchQuery && results.length === 0 && (
                  <div className="py-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                    <p className="text-gray-500">다른 키워드로 검색해보세요</p>
                  </div>
                )}

                {/* Suggestions */}
                {!searchQuery && suggestions.length > 0 && (
                  <div className="py-2">
                    <div className="px-6 py-2">
                      <h3 className="text-sm font-medium text-gray-500">추천 검색어</h3>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.value}`}
                        className={cn(
                          "w-full px-6 py-2 text-left hover:bg-gray-50 flex items-center gap-3",
                          index === selectedSuggestion && "bg-primary-50"
                        )}
                        onClick={() => handleSuggestionSelect(suggestion.value)}
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-gray-700">{suggestion.value}</span>
                        <span className="text-xs text-gray-400">({suggestion.count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="py-2">
                    <div className="px-6 py-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500">최근 검색</h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        전체 삭제
                      </button>
                    </div>
                    {recentSearches.slice(0, 5).map((recent) => (
                      <button
                        key={recent}
                        className="w-full px-6 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        onClick={() => handleRecentSearchSelect(recent)}
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700">{recent}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Tags */}
                {!searchQuery && popularTags.length > 0 && (
                  <div className="py-2">
                    <div className="px-6 py-2">
                      <h3 className="text-sm font-medium text-gray-500">인기 태그</h3>
                    </div>
                    <div className="px-6 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {popularTags.slice(0, 15).map((tag) => (
                          <button
                            key={tag.value}
                            onClick={() => handleTagSelect(tag.value)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm border transition-all",
                              currentFilters.tags?.includes(tag.value)
                                ? "bg-primary-100 border-primary-300 text-primary-700"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            #{tag.value}
                            <span className="ml-1 text-xs opacity-60">({tag.count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearch;