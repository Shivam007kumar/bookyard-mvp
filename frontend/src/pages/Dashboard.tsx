import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  CheckCircle, 
  BookOpen, 
  MessageCircle, 
  ArrowRightLeft, 
  RotateCcw,
  Library,
  Loader2,
  AlertTriangle
} from 'lucide-react';

// --- TYPES ---
interface User {
  id: number;
  full_name: string;
  unit_no: string;
  whatsapp_no: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image: string | null;
  status: string;
}

interface Transaction {
  id: number;
  status: string;
  book: Book;
  borrower: User;
  owner: User;
}

export default function Dashboard() {
  const [userId, setUserId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Get User ID
      const userRes = await api.get('/users/me');
      if (!userRes.data || !userRes.data.id) throw new Error("Could not fetch user profile");
      const currentUserId = userRes.data.id;
      setUserId(currentUserId);

      // 2. Fetch Requests
      const txnRes = await api.get('/transactions/my-requests');
      
      // ADD THIS LINE TO DEBUG
      console.log("My Transactions:", txnRes.data); 

      setTransactions(Array.isArray(txnRes.data) ? txnRes.data : []);
      // ... existing code ...
      // 3. Fetch My Books (Check if this endpoint exists first!)
      try {
        const bookRes = await api.get('/books/my-books');
        setMyBooks(Array.isArray(bookRes.data) ? bookRes.data : []);
      } catch (err) {
        console.warn("Could not fetch my books (Endpoint might be missing in backend)", err);
        setMyBooks([]); // Default to empty if endpoint fails
      }

    } catch (err: any) {
      console.error("Dashboard Load Error:", err);
      setError("Failed to load dashboard. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (txnId: number, action: 'approve' | 'handover' | 'return') => {
    try {
      await api.put(`/transactions/${txnId}/${action}`);
      loadData(); 
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  if (error) return (
    <div className="p-10 text-center text-red-600">
      <AlertTriangle className="mx-auto mb-2" size={40} />
      <h3 className="text-xl font-bold">Something went wrong</h3>
      <p>{error}</p>
      <button onClick={loadData} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded">Retry</button>
    </div>
  );

  // --- SAFE FILTERING LOGIC ---
  // We use `?.` to safely access properties. If `owner` is null, it won't crash.
  const incomingRequests = transactions.filter(t => t?.owner?.id && Number(t.owner.id) === Number(userId));
  const outgoingRequests = transactions.filter(t => t?.borrower?.id && Number(t.borrower.id) === Number(userId));

  return (
    <div className="space-y-10 pb-20 mt-6">
      
      {/* SECTION 1: MY LIBRARY */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Library className="text-purple-600" /> 
          My Library (Uploaded Books)
        </h2>
        
        {myBooks.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            You haven't listed any books yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBooks.map(book => (
              <div key={book.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 shadow-sm">
                <div className="w-16 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-slate-500">{book.author}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                    book.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {book.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="border-slate-200" />

      {/* SECTION 2: INCOMING REQUESTS */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> 
          Requests for My Books
        </h2>
        
        {incomingRequests.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            No active requests.
          </div>
        ) : (
          <div className="grid gap-4">
            {incomingRequests.map(txn => (
              <IncomingCard key={txn.id} txn={txn} onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: MY REQUESTS */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ArrowRightLeft className="text-emerald-600" />
          Books I Requested
        </h2>

        {outgoingRequests.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            You haven't requested anything.
          </div>
        ) : (
          <div className="grid gap-4">
            {outgoingRequests.map(txn => (
              <OutgoingCard key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// --- SUB COMPONENTS (With Safety Checks) ---

function IncomingCard({ txn, onAction }: { txn: Transaction, onAction: Function }) {
  // Safe Access: txn?.book?.title ensures we don't crash if book is missing
  const bookTitle = txn?.book?.title || "Unknown Book";
  const borrowerName = txn?.borrower?.full_name || "Unknown User";
  const borrowerUnit = txn?.borrower?.unit_no || "N/A";
  const coverImg = txn?.book?.cover_image;

  const isPending = txn.status === 'Requested';
  const isApproved = txn.status === 'Approved';
  const isCompleted = txn.status === 'Completed';

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="w-16 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
        {coverImg && <img src={coverImg} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-slate-900">{bookTitle}</h3>
        <p className="text-sm text-slate-500">Requested by <span className="font-bold">{borrowerName}</span> (Unit: {borrowerUnit})</p>
        <StatusBadge status={txn.status} />
      </div>
      <div className="flex gap-2">
        {isPending && (
          <button onClick={() => onAction(txn.id, 'approve')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            <CheckCircle size={16} className="inline mr-1"/> Approve
          </button>
        )}
        {isApproved && (
          <button onClick={() => onAction(txn.id, 'handover')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">
            <ArrowRightLeft size={16} className="inline mr-1"/> Handover
          </button>
        )}
        {isCompleted && (
          <button onClick={() => onAction(txn.id, 'return')} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-900">
            <RotateCcw size={16} className="inline mr-1"/> Returned
          </button>
        )}
      </div>
    </div>
  );
}

function OutgoingCard({ txn }: { txn: Transaction }) {
  const bookTitle = txn?.book?.title || "Unknown Book";
  const ownerName = txn?.owner?.full_name || "Unknown Owner";
  const ownerUnit = txn?.owner?.unit_no || "N/A";
  const ownerPhone = txn?.owner?.whatsapp_no || "N/A";
  const coverImg = txn?.book?.cover_image;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
       <div className="w-16 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
        {coverImg && <img src={coverImg} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-slate-900">{bookTitle}</h3>
        <p className="text-sm text-slate-500">Owner: <span className="font-bold">{ownerName}</span> (Unit: {ownerUnit})</p>
        <StatusBadge status={txn.status} />
        {txn.status === 'Approved' && (
          <div className="mt-2 text-green-700 bg-green-50 px-3 py-1 rounded inline-flex items-center gap-2 text-sm font-medium">
             <MessageCircle size={14}/> WhatsApp Owner: {ownerPhone}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Requested: "bg-amber-100 text-amber-800",
    Approved: "bg-indigo-100 text-indigo-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Returned: "bg-slate-100 text-slate-600",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[status]}`}>{status || "Unknown"}</span>;
}