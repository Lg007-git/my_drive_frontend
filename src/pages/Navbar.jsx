import React, { useState } from "react";

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-blue-600 text-white mb-4 rounded-lg">
      {/* Logo / Title */}
      <div className="text-xl font-bold">My Drive</div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="flex-1 mx-6 bg-white max-w-md">
        <input
          type="text"
          placeholder="Search files or folders..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-black"
        />
      </form>

      {/* Actions */}
      
    </nav>
  );
}
