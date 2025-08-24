import React, { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState<{ text: string; done: boolean }[]>([
    { text: 'yhyhu', done: true }
  ]);
  const [input, setInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([{ text: input.trim(), done: false }, ...todos]);
      setInput('');
    }
  };

  const toggleDone = (idx: number) => {
    setTodos(todos =>
      todos.map((todo, i) => (i === idx ? { ...todo, done: !todo.done } : todo))
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-xs mx-auto min-h-[295px] flex flex-col">
      <h3 className="text-base font-semibold text-gray-700 mb-2">To-Do List</h3>
      <form onSubmit={handleAdd} className="mb-3">
        <input
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
          placeholder="Enter your task here"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </form>
      <div className="flex-1 overflow-y-auto space-y-2">
        {todos.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-6">No tasks yet!</div>
        )}
        {todos.map((todo, idx) => (
          <div
            key={idx}
            className="flex items-center bg-gray-50 rounded px-3 py-2"
          >
            <button
              className="mr-2"
              onClick={() => toggleDone(idx)}
              aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
              tabIndex={0}
            >
              <span
                className={`inline-block w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  todo.done
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {todo.done ? '✔' : ''}
              </span>
            </button>
            <span
              className={`flex-1 text-sm truncate ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}
            >
              {todo.text}
            </span>
            <button
              className="ml-2 text-gray-400 hover:text-red-500"
              onClick={() => setTodos(todos => todos.filter((_, i) => i !== idx))}
              aria-label="Delete"
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#e5e7eb"/>
                <rect x="9" y="11" width="6" height="2" rx="1" fill="#6b7280"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}