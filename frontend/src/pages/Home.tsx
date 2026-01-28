import { useState, useEffect } from 'react';
import { Search, Book, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Sci-Fi", "Mystery", "Romance", "Self-Help", "Business", "Academic"];

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All"); // <--- New State

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]); // <--- Re-fetch when category changes

  const fetchBooks = async () => {
    try {
      // Pass category to backend
      const res = await api.get(`/books?search=${search}&category=${selectedCategory}`);
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async (bookId: number) => {
    if (!confirm('Request this book for 1 Credit?')) return;
    try {
      await api.post('/transactions/request', { book_id: bookId });
      alert('Request Sent! Wait for the owner to approve.');
      fetchBooks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Request failed');
    }
  };

  return (
    <div className="mt-8 mb-20">
      {/* Hero / Search Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find your next read</h1>
        <p className="text-slate-500 mb-6">Exchange books with your neighbors instantly.</p>
        
        <div className="relative max-w-lg mx-auto mb-6">
          <input 
            placeholder="Search by title..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchBooks()}
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
        </div>

        {/* NEW: Category Filter Bar */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Link to="/add-book" className="text-indigo-600 font-medium hover:underline text-sm">
             Or list a book to earn credits &rarr;
          </Link>
        </div>
      </div>

      {/* Book Grid */}
      {books.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Book className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 text-lg">No books found in {selectedCategory}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden relative flex items-center justify-center bg-slate-100">
                {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-center bg-indigo-100 text-indigo-800 font-bold">
                    {book.title}
                  </div>
                )}
                 {/* Category Badge on Card */}
                 <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded">
                    {book.category}
                 </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{book.title}</h3>
                  <p className="text-slate-500 text-sm mb-3">by {book.author}</p>
                </div>
                <button 
                  onClick={() => handleRequest(book.id)}
                  className="mt-5 w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-600 transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Request Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}