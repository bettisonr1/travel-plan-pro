import React from 'react';
import ItemList from './components/ItemList';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Full-Stack <span className="text-blue-600">Skeleton</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            A clean starter with React, Tailwind CSS, Express, and MongoDB.
          </p>
        </header>

        <main>
          <ItemList />
        </main>
        
        <footer className="mt-20 text-center text-gray-400 text-sm">
          <p>Built with Controller-Service-Repository-Model pattern</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
