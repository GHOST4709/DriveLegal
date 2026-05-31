import { useState, useRef, useEffect } from "react";
import { sendChatToAI } from "./api";
import  Dashboard from './components/Dashboard.jsx'; 
function App() {
  return (
      <Dashboard />
  )
}
export default App




// # ===========================================================================
// # Endpoint SomeThing.....Below this is the AI bot check 
// # ===========================================================================


// export default function App() {
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState([
//     { role: "ai", text: "Hello! I am your BIMSTEC Road Safety AI. Ask me about traffic laws or fines in Dhaka or Bangkok." }
//   ]);
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to the bottom when a new message arrives
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, isLoading]);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userText = input;
//     setInput(""); // Clear input immediately for better UX
//     setMessages((prev) => [...prev, { role: "user", text: userText }]);
//     setIsLoading(true);

//     // Call the Python Backend
//     const aiResponse = await sendChatToAI(userText);

//     setMessages((prev) => [...prev, { role: "ai", text: aiResponse.reply }]);
//     setIsLoading(false);
//   };

//   return (
//     // Midnight Gradient Background
//     <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 flex items-center justify-center p-4 font-sans">
      
//       // Glassmorphism Container
//       <div className="w-full max-w-4xl h-[85vh] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
//         {/* Header */}
//         <div className="bg-white/5 border-b border-white/10 p-5 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
//             <h1 className="text-xl font-semibold tracking-wide text-white">Road Safety AI</h1>
//           </div>
//           <span className="text-sm text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
//             BIMSTEC Hackathon
//           </span>
//         </div>

//         {/* Chat Messages Area */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
//           {messages.map((msg, index) => (
//             <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
//               <div 
//                 className={`max-w-[80%] md:max-w-[70%] p-4 leading-relaxed ${
//                   msg.role === "user" 
//                     ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-blue-900/20" 
//                     : "bg-slate-800/80 border border-slate-700 text-slate-100 rounded-2xl rounded-tl-sm shadow-md"
//                 }`}
//               >
//                 {msg.text}
//               </div>
//             </div>
//           ))}
          
//           {/* Loading Indicator */}
//           {isLoading && (
//             <div className="flex justify-start">
//               <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center shadow-md">
//                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
//                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Area */}
//         <form onSubmit={handleSendMessage} className="bg-slate-900/50 border-t border-white/10 p-4">
//           <div className="flex gap-3">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Ask about a traffic law (e.g., 'Speeding in Dhaka on a bike')..."
//               className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-slate-500"
//               disabled={isLoading}
//             />
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim()}
//               className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center"
//             >
//               Send
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }



