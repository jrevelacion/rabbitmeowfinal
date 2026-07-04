import { Search, History } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SearchSuggestions = ({ suggestions, onSuggestionClick }: SearchSuggestionsProps) => {
  if (!suggestions.length) return null;
  
  return (
    <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-md shadow-lg overflow-hidden animate-fade-in">
      <ul className="py-1">
        {suggestions.map((suggestion, index) => {
          // Determine if this is likely a history item (first 2 items if from history)
          const isHistory = index < 2;
          
          return (
            <li key={index}>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 text-left group"
                onClick={() => onSuggestionClick(suggestion)}
                type="button"
              >
                {isHistory ? (
                  <History className="h-4 w-4 mr-2 text-white/50 group-hover:text-accent transition-colors" />
                ) : (
                  <Search className="h-4 w-4 mr-2 text-white/50 group-hover:text-accent transition-colors" />
                )}
                <span className="flex-1 truncate">{suggestion}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SearchSuggestions;
