import React from 'react';
import { Input } from "./ui/input";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <Input
      type="text"
      placeholder="Search tasks and events..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-64"
    />
  );
};

export default SearchBar;