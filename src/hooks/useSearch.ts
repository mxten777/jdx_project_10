import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  startAfter,
  QueryConstraint,
  Timestamp,
  // DocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { secureLogger } from '../utils/security';

export interface SearchFilters {
  searchQuery?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isPublic?: boolean;
  hasImages?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isPublic: boolean;
  imageUrls: string[];
  location?: string;
  persons?: string[];
  // Search relevance score
  score?: number;
  // Highlighted text for search results
  highlightedTitle?: string;
  highlightedContent?: string;
}

export interface SearchSuggestion {
  type: 'tag' | 'author' | 'location' | 'person';
  value: string;
  count: number;
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<SearchSuggestion[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jdx_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        secureLogger.error('Failed to load recent searches', error as Error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('jdx_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('jdx_recent_searches');
  }, []);

  // Build Firestore searchQuery with filters
  const buildQuery = useCallback((filters: SearchFilters, isLoadMore = false) => {
    const constraints: QueryConstraint[] = [];
    
    // Text search (simplified - in production use Algolia or similar)
    if (filters.searchQuery) {
      // This is a simplified approach - for better search, use a search service
      constraints.push(where('isPublic', '==', true));
    }

    // Tag filtering
    if (filters.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    // Author filtering
    if (filters.author) {
      constraints.push(where('authorId', '==', filters.author));
    }

    // Date range filtering
    if (filters.dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end))
      );
    }

    // Public/private filtering
    if (filters.isPublic !== undefined) {
      constraints.push(where('isPublic', '==', filters.isPublic));
    }

    // Has images filtering
    if (filters.hasImages) {
      constraints.push(where('imageUrls', '!=', []));
    }

    // Sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder || 'desc';
    constraints.push(orderBy(sortField, sortDirection));

    // Pagination
    if (isLoadMore && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Limit
    const limitCount = filters.limit || 20;
    constraints.push(firestoreLimit(limitCount));

    return query(collection(firestore, 'memories'), ...constraints);
  }, [lastDoc]);

  // Highlight search terms in text
  const highlightText = useCallback((text: string, searchQuery: string): string => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }, []);

  // Calculate search relevance score
  const calculateScore = useCallback((item: any, searchQueryParam: string): number => {
    if (!searchQueryParam.trim()) return 0;

    let score = 0;
    const searchQuery = searchQueryParam.toLowerCase();

    // Title matches (highest weight)
    if (item.title?.toLowerCase().includes(searchQuery)) {
      score += 10;
      if (item.title?.toLowerCase().startsWith(searchQuery)) {
        score += 5; // Bonus for starts with
      }
    }

    // Description matches
    if (item.description?.toLowerCase().includes(searchQuery)) {
      score += 5;
    }

    // Content matches
    if (item.content?.toLowerCase().includes(searchQuery)) {
      score += 3;
    }

    // Tag matches
    if (item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery))) {
      score += 7;
    }

    // Location matches
    if (item.location?.toLowerCase().includes(searchQuery)) {
      score += 4;
    }

    // Person matches
    if (item.persons?.some((person: string) => person.toLowerCase().includes(searchQuery))) {
      score += 4;
    }

    // Recent documents get a small boost
    const daysSinceCreated = (Date.now() - item.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score += Math.max(0, 2 - daysSinceCreated / 15);
    }

    return score;
  }, []);

  // Perform search
  const search = useCallback(async (filters: SearchFilters, isLoadMore = false) => {
    if (!isLoadMore) {
      setIsSearching(true);
      setResults([]);
      setLastDoc(null);
    }

    try {
      const searchQuery = buildQuery(filters, isLoadMore);
      const snapshot = await getDocs(searchQuery);
      
      const newResults: SearchResult[] = snapshot.docs.map(doc => {
        const data = (doc.data() as any);
        const result: SearchResult = {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          content: data.content || data.text || '',
          tags: data.tags || [],
          authorId: data.authorId || '',
          authorName: data.authorName || data.userEmail || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isPublic: data.isPublic ?? true,
          imageUrls: data.urls || data.imageUrls || [],
          location: data.location,
          persons: data.persons
        };

        // Calculate relevance score and add highlights
        if (filters.searchQuery) {
          result.score = calculateScore(data, filters.searchQuery);
          result.highlightedTitle = highlightText(result.title, filters.searchQuery);
          result.highlightedContent = highlightText(result.content, filters.searchQuery);
        }

        return result;
      });

      // Sort by relevance score if searching
      if (filters.searchQuery) {
        newResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      }

      if (isLoadMore) {
        setResults(prev => [...prev, ...newResults]);
      } else {
        setResults(newResults);
        // Save search searchQuery to recent searches
        if (filters.searchQuery) {
          saveRecentSearch(filters.searchQuery);
        }
      }

      // Update pagination state
      setHasMore(snapshot.docs.length === (filters.limit || 20));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);

      secureLogger.log('Search completed', {
        searchQuery: filters.searchQuery,
        resultsCount: newResults.length,
        isLoadMore
      });

    } catch (error) {
      secureLogger.error('Search failed', error as Error);
      if (!isLoadMore) {
        setResults([]);
      }
    } finally {
      if (!isLoadMore) {
        setIsSearching(false);
      }
    }
  }, [buildQuery, calculateScore, highlightText, saveRecentSearch]);

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string, type?: SearchSuggestion['type']) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestions: SearchSuggestion[] = [];
      
      // Get tag suggestions
      if (!type || type === 'tag') {
        const tagsQuery = query(
          collection(firestore, 'memories'),
          where('tags', 'array-contains-any', [searchQuery.toLowerCase()]),
          firestoreLimit(5)
        );
        
        const tagsSnapshot = await getDocs(tagsQuery);
        const tagCounts = new Map<string, number>();
        
        tagsSnapshot.docs.forEach(doc => {
          const tags = (doc.data() as any).tags || [];
          tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(searchQuery.toLowerCase())) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          });
        });

        tagCounts.forEach((count, tag) => {
          suggestions.push({ type: 'tag', value: tag, count });
        });
      }

      // Get location suggestions
      if (!type || type === 'location') {
        const locationsQuery = query(
          collection(firestore, 'memories'),
          where('location', '>=', searchQuery),
          where('location', '<=', searchQuery + '\uf8ff'),
          firestoreLimit(5)
        );
        
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationCounts = new Map<string, number>();
        
        locationsSnapshot.docs.forEach(doc => {
          const location = (doc.data() as any).location;
          if (location) {
            locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
          }
        });

        locationCounts.forEach((count, location) => {
          suggestions.push({ type: 'location', value: location, count });
        });
      }

      // Sort by count and limit
      const sortedSuggestions = suggestions
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setSuggestions(sortedSuggestions);

    } catch (error) {
      secureLogger.error('Failed to get suggestions', error as Error);
      setSuggestions([]);
    }
  }, []);

  // Load popular tags
  useEffect(() => {
    const loadPopularTags = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(firestore, 'memories'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            firestoreLimit(100)
          )
        );

        const tagCounts = new Map<string, number>();
        
        snapshot.docs.forEach(doc => {
          const tags = (doc.data() as any).tags || [];
          tags.forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        const popular = Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ type: 'tag' as const, value: tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        setPopularTags(popular);

      } catch (error) {
        secureLogger.error('Failed to load popular tags', error as Error);
      }
    };

    loadPopularTags();
  }, []);

  // Memoized search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (filters: SearchFilters, delay = 300) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        search(filters);
      }, delay);
    };
  }, [search]);

  return {
    results,
    suggestions,
    isSearching,
    hasMore,
    recentSearches,
    popularTags,
    search,
    debouncedSearch,
    loadMore: (filters: SearchFilters) => search(filters, true),
    getSuggestions,
    clearRecentSearches
  };
};
