import { useState } from 'react';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title,
      content,
      synced: false,
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow rounded p-4">
        <h1 className="text-2xl font-bold mb-4">📝 Meine Notizen</h1>

        <input
          className="w-full border p-2 mb-2 rounded"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border p-2 mb-4 rounded"
          rows="4"
          placeholder="Inhalt"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={addNote}
        >
          Notiz speichern
        </button>

        <div className="mt-6 space-y-4">
          {notes.map(note => (
            <div key={note.id} className="border p-3 rounded bg-gray-50">
              <h2 className="font-semibold text-lg">{note.title}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <small className="text-xs text-gray-500">Zuletzt geändert: {new Date(note.updatedAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;