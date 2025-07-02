export default function ChatSidebar() {
  return (
    <div>
      <h3 className="font-bold mb-2">Chat</h3>
      <div className="bg-white p-2 rounded shadow mb-2">Aman: 🎯 What is the assignment for next week?</div>
      <input type="text" placeholder="Ask Query..." className="w-full px-2 py-1 border rounded" />
    </div>
  );
}
