import { useState } from 'react';
import { Search, BookPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

const CATEGORIES = ["Fiction", "Non-Fiction", "Sci-Fi", "Mystery", "Romance", "Self-Help", "Business", "Academic", "Biographies"];

export default function AddBook() {
  const navigate = useNavigate();
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState<any>(null);
  const [condition, setCondition] = useState('Good');
  const [category, setCategory] = useState("Fiction");

  const handleLookup = async () => {
    if (!isbn) return;
    setLoading(true);
    setBookData(null);
    try {
      // The backend will now handle dashes automatically
      const res = await api.get(`/books/lookup?isbn=${isbn}`);
      setBookData(res.data);
    } catch (err) {
      alert("Book not found. Please try a different ISBN.");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
  if (!bookData) return;
  try {
    await api.post('/books', {
      ...bookData,
      isbn,
      condition,
      category
    });
    alert("Book Listed! You earned 1 Credit.");
    navigate('/');
  } catch (err) {
    alert("Failed to list book");
  }
};

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookPlus className="text-indigo-600" /> List a Book
      </h2>

      {/* ISBN Input Section */}
      <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
        <label className="block text-sm font-semibold text-slate-700 mb-2">ISBN Number</label>
        <div className="flex gap-2">
          <input 
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="e.g. 9780143454212"
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
          <button 
            onClick={handleLookup}
            disabled={loading}
            className="bg-slate-900 text-white px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
            Search
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Found above the barcode on the back of your book.</p>
      </div>

      {/* Preview Section */}
      {bookData && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="flex gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
            {/* Cover Image */}
            <div className="w-24 h-36 bg-slate-100 rounded-md shadow-sm overflow-hidden flex-shrink-0">
               {bookData.cover_image ? (
                  <img src={bookData.cover_image} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
               )}
            </div>
            
            {/* Details */}
            <div className="flex-1">
              <h3 className="font-bold text-xl text-slate-900 mb-1">{bookData.title}</h3>
              <p className="text-slate-600 font-medium mb-4">by {bookData.author}</p>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Condition</label>
                  <select 
                    className="block w-full mt-1 p-2.5 border rounded-lg bg-slate-50 focus:bg-white transition outline-none"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="Good">Good (Minor wear)</option>
                    <option value="Fair">Fair (Readable, some damage)</option>
                    <option value="Poor">Poor (Heavily worn)</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Category</label>
                  <select 
                    className="block w-full mt-1 p-2.5 border rounded-lg bg-slate-50 focus:bg-white transition outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.99] transition shadow-lg shadow-indigo-200"
          >
            Confirm & List Book (+1 Credit)
          </button>
        </div>
      )}
    </div>
  );
}