// frontend/src/components/common/SearchBar.tsx
"use client";

import React, { FC, useState, useEffect } from "react";
import Button from "./Button";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
}

const SearchBar: FC<SearchBarProps> = ({ initialValue = "", placeholder = "Search...", onSearch }) => {
  const [keyword, setKeyword] = useState(initialValue);

  // Sync with initialValue when it changes externally
  useEffect(() => {
    setKeyword(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword.trim());
  };

  // Also trigger search on Enter key or when clearing the input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(keyword.trim());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    // If user clears the input, trigger search immediately
    if (value === '') {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto">
      <input
        type="text"
        value={keyword}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-700"
      />
      <Button type="submit" variant="primary">
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
