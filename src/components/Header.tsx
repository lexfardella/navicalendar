import React from 'react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setIsAddingTask: () => void;
  setIsAddingEvent: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, setIsAddingTask, setIsAddingEvent }) => {
  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Navi Calendar</h1>
        <div className="flex space-x-2">
        </div>
      </div>
    </header>
  );
};

export default Header;