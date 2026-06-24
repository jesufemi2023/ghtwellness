import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Video, 
  MoreVertical, 
  ArrowLeft, 
  Check, 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  ShieldCheck, 
  Star,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  sender: "customer" | "expert";
  text: string;
  time: string;
  isRead?: boolean;
  image?: string;
  productCard?: {
    name: string;
    price: string;
    buttonText: string;
  };
}

interface SuccessStory {
  id: string;
  patientName: string;
  location: string;
  avatarText: string;
  avatarColor: string;
  condition: string;
  lastMessage: string;
  lastActive: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface WhatsAppSuccessHubProps {
  onOrderPackageByName: (packageName: string) => void;
}

export function WhatsAppSuccessHub({ onOrderPackageByName }: WhatsAppSuccessHubProps) {
  const stories: SuccessStory[] = [
    {
      id: "prostate-vigor",
      patientName: "Mr. Babajide Olatunji",
      location: "Lekki, Lagos",
      avatarText: "BO",
      avatarColor: "bg-emerald-600",
      condition: "Men's Vigor & Prostate Health",
      lastMessage: "Thank you doctor, my wife is so happy now! High energy all day.",
      lastActive: "Just now",
      unreadCount: 1,
      messages: [
        {
          id: "m1",
          sender: "customer",
          text: "Good morning. I was referred by a colleague who bought your Prostate and Vigor Therapy. To be honest, I'm very skeptical because I have spent over ₦150,000 on different herbal drugs and teas, and my performance is still zero. Also, I wake up 5 to 6 times every single night to urinate, and the flow is very weak.",
          time: "08:14 AM"
        },
        {
          id: "m2",
          sender: "expert",
          text: "Hello Mr. Babajide. We completely understand your skepticism. Many of our patients have been through the exact same path. The reason cheap herbal remedies fail is that they only offer temporary stimulation or use low-grade raw materials. \n\nOur GHT Men's Vigor Combo works at a cellular level. It uses highly concentrated active saponins and cellular-rebuilding organic extracts to reduce prostate inflammation, clean arterial passages, and flood your system with natural nitric oxide.",
          time: "08:20 AM",
          isRead: true
        },
        {
          id: "m3",
          sender: "customer",
          text: "Hmm. I see. How long before I start seeing changes? I'm 52, and my marriage is getting highly strained. It's really embarrassing and depressing.",
          time: "08:24 AM"
        },
        {
          id: "m4",
          sender: "expert",
          text: "Most men notice a major difference in urination frequency within 4 to 7 days. You will sleep throughout the night without constant waking. Your physical energy and morning strength will begin restoring by the second week. For complete organic cell healing and shrinkage of an inflamed prostate, we recommend the 3-Month Complete Vigor Kit.",
          time: "08:31 AM",
          isRead: true
        },
        {
          id: "m5",
          sender: "customer",
          text: "Okay. I will trust you on this one and buy the Complete Vigor Treatment. Can I pay on delivery? I live in Lekki.",
          time: "08:35 AM"
        },
        {
          id: "m6",
          sender: "expert",
          text: "Yes, absolutely! We offer Pay-On-Delivery across Lagos. The dispatcher will deliver it in a highly discreet brown box. Nobody will know what is inside.",
          time: "08:38 AM",
          isRead: true
        },
        {
          id: "m7",
          sender: "customer",
          text: "That is excellent! Let me place the order.",
          time: "08:40 AM"
        },
        {
          id: "m8",
          sender: "customer",
          text: "Hello doctor! This is my third week of using the Vigor Therapy. I had to message you because this is a miracle! I only wake up once a night now, and the flow is powerful. As for performance, my wife is incredibly happy and surprised! My energy levels are back to when I was in my 30s. Thank you so much GHT!",
          time: "09:02 AM"
        },
        {
          id: "m9",
          sender: "expert",
          text: "Wow, fantastic news Mr. Babajide! We are extremely happy for you and your family. That is the power of authentic cellular nutrition. Please complete the full dosage to lock in the recovery permanently! 🙌✨",
          time: "09:15 AM",
          isRead: true,
          productCard: {
            name: "Men's Vigor Combo Kit",
            price: "₦95,000",
            buttonText: "Order Babajide's Treatment"
          }
        }
      ]
    },
    {
      id: "diabetes-sugar",
      patientName: "Mrs. Chioma Onyekwere",
      location: "Enugu",
      avatarText: "CO",
      avatarColor: "bg-indigo-600",
      condition: "Severe Diabetes & Blood Sugar",
      lastMessage: "My fasting sugar dropped from 340 to 95 mg/dL! Doctor is shocked.",
      lastActive: "15 mins ago",
      unreadCount: 0,
      messages: [
        {
          id: "d1",
          sender: "customer",
          text: "Good afternoon. Please, I need help. My fasting blood sugar has been 320 - 340 mg/dL for the past 6 months despite my insulin injections. My legs are constantly numb, I feel burning sensations in my feet, and I have lost over 12kg of weight. I feel so weak and tired all the time.",
          time: "02:10 PM"
        },
        {
          id: "d2",
          sender: "expert",
          text: "Good afternoon Mrs. Chioma. Please stay calm. What you are experiencing is peripheral neuropathy (numbness) due to high glucose levels clogging your blood capillaries.\n\nTraditional treatments only manage the blood sugar superficially. Our GHT Sugar Balance therapy works to repair your pancreatic beta-cells so your body can naturally produce and utilize insulin again, while clearing toxic sugars from your tissues.",
          time: "02:18 PM",
          isRead: true
        },
        {
          id: "d3",
          sender: "customer",
          text: "Is it safe to take alongside my doctor's medication? I don't want any kidney complications.",
          time: "02:22 PM"
        },
        {
          id: "d4",
          sender: "expert",
          text: "Yes, it is 100% safe. Our formulation is entirely organic, NAFDAC-approved, and causes zero chemical stress. In fact, it supports kidney health. You can take it 1 hour after your normal hospital medications. As your sugar normalizes, your physician will naturally reduce your insulin dosage.",
          time: "02:29 PM",
          isRead: true
        },
        {
          id: "d5",
          sender: "customer",
          text: "Okay, I am starting with the Sugar Balance Therapy. Let me order it now.",
          time: "02:35 PM"
        },
        {
          id: "d6",
          sender: "customer",
          text: "Doctor! I have some amazing news! I went for my weekly lab test today. My fasting sugar came down to 98 mg/dL! The doctor was asking if the lab machine was broken. I told him I am taking GHT! The numbness in my feet is also 80% gone. I have so much strength now. Thank you so, so much!",
          time: "11:05 AM"
        },
        {
          id: "d7",
          sender: "expert",
          text: "Glory be to God, Mrs. Chioma! 98 mg/dL is perfect! Your pancreas is reviving. Continue the capsules to fully reinforce your metabolic pathways. We are incredibly proud of your healing!",
          time: "11:20 AM",
          isRead: true,
          productCard: {
            name: "Sugar Balance Package",
            price: "₦78,000",
            buttonText: "Order Chioma's Treatment"
          }
        }
      ]
    },
    {
      id: "hypertension-cardio",
      patientName: "Alhaji Ibrahim Musa",
      location: "Kano",
      avatarText: "IM",
      avatarColor: "bg-teal-600",
      condition: "Hypertension & Arterial Cleanse",
      lastMessage: "My BP is stable at 120/80 now. Headaches are completely gone.",
      lastActive: "1 hour ago",
      unreadCount: 0,
      messages: [
        {
          id: "h1",
          sender: "customer",
          text: "Assalamu Alaikum. I need your high-potency Cardio Cleanse treatment. My blood pressure is 170/110. I suffer from severe chest heaviness, vibrating ears, and constant morning headaches. I am tired of taking chemical pills every single day.",
          time: "10:15 AM"
        },
        {
          id: "h2",
          sender: "expert",
          text: "Wa Alaikum Assalam, Alhaji Ibrahim. High BP is a symptom of arterial narrowing and stiffening. Simply forcing the heart to beat slower using chemical beta-blockers does not solve the clogging inside the blood vessels. \n\nOur GHT Cardio Cleanse uses organic botanical extracts that systematically melt cholesterol plaques, improve blood elasticity, and restore healthy circulation. This naturally and permanently lowers your pressure.",
          time: "10:25 AM",
          isRead: true
        },
        {
          id: "h3",
          sender: "customer",
          text: "I want to buy. Do you deliver to Kano? How many days?",
          time: "10:32 AM"
        },
        {
          id: "h4",
          sender: "expert",
          text: "Yes, we ship to Kano via secure air cargo, and it takes 48 hours. You will pay the dispatcher on delivery.",
          time: "10:40 AM",
          isRead: true
        },
        {
          id: "h5",
          sender: "customer",
          text: "Hello, doctor. My package was delivered on Wednesday. I have been taking it as instructed. My head is so light, the ear vibration has stopped entirely, and my BP reading this morning is 125/82! This is unbelievable. Thank you very much.",
          time: "04:12 PM"
        },
        {
          id: "h6",
          sender: "expert",
          text: "Excellent recovery, Alhaji! Your blood vessels are breathing again. Continue the dosage to maintain perfect cardio vascular health. Health is wealth!",
          time: "04:30 PM",
          isRead: true,
          productCard: {
            name: "Cardio Cleanse Combo",
            price: "₦85,000",
            buttonText: "Order Alhaji's Treatment"
          }
        }
      ]
    }
  ];

  const [activeStoryId, setActiveStoryId] = useState<string>("prostate-vigor");
  const activeStory = stories.find(s => s.id === activeStoryId) || stories[0];

  return (
    <div className="bg-slate-100 rounded-[32px] border border-slate-200 overflow-hidden shadow-xl my-16 max-w-4xl mx-auto">
      
      {/* Title Header */}
      <div className="bg-white px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs uppercase tracking-widest mb-1">
            <Users size={14} />
            Live Consultations
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Verified WhatsApp Success Stories
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Real chat logs from our patients. Click on a chat to read their consultation.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
          <ShieldCheck size={12} fill="currentColor" className="text-emerald-100 fill-emerald-600" />
          HIPAA & Privacy Compliant
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[550px] bg-slate-50">
        
        {/* Left Side: Story list (Tabs) */}
        <div className="w-full md:w-[35%] bg-white border-r border-slate-200 overflow-y-auto flex md:flex-col shrink-0">
          {stories.map(story => (
            <button
              key={story.id}
              onClick={() => setActiveStoryId(story.id)}
              className={`w-full text-left p-4 flex items-center gap-3 border-b border-slate-100 hover:bg-slate-50/50 transition-colors shrink-0 md:shrink ${
                activeStoryId === story.id ? "bg-emerald-50/40 border-l-4 border-l-emerald-600" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${story.avatarColor}`}>
                {story.avatarText}
              </div>
              <div className="flex-1 min-w-0 hidden md:block">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {story.patientName.split(" ")[0] + " " + story.patientName.split(" ")[1]}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {story.lastActive}
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-600 truncate mb-0.5 uppercase tracking-wide">
                  {story.condition.split(" & ")[0]}
                </p>
                <p className="text-xs text-slate-400 truncate font-medium">
                  {story.lastMessage}
                </p>
              </div>
              
              {/* Mobile Only indicator */}
              <div className="md:hidden flex flex-col items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-slate-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {story.patientName.split(" ")[1]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Active Chat Window */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#efeae2] relative">
          
          {/* Subtle WhatsApp Wallpaper Grid */}
          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#128c7e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${activeStory.avatarColor}`}>
                {activeStory.avatarText}
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  {activeStory.patientName}
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full text-white/90">
                    {activeStory.location}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  online • {activeStory.condition}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/80">
              <Video size={18} className="cursor-pointer hover:text-white" />
              <Phone size={16} className="cursor-pointer hover:text-white" />
              <MoreVertical size={18} className="cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Security Banner */}
          <div className="bg-[#ffe596] text-[#614b14] text-[11px] font-semibold py-1.5 px-4 text-center border-b border-amber-100/50 flex items-center justify-center gap-1.5 relative z-10 shadow-sm">
            <Lock size={12} />
            Messages are end-to-end encrypted. No external party can view your healthcare files.
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 flex flex-col">
            {activeStory.messages.map((msg, i) => {
              const isUser = msg.sender === "customer";
              return (
                <div 
                  key={msg.id} 
                  className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}
                >
                  <div className={`relative max-w-[85%] md:max-w-[75%] px-4 py-2.5 rounded-2xl shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${
                    isUser 
                      ? "bg-white text-slate-800 rounded-tl-none border-t border-slate-100" 
                      : "bg-[#d9fdd3] text-slate-800 rounded-tr-none"
                  }`}>
                    {/* Role Title */}
                    <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1 flex items-center gap-1">
                      <span className={isUser ? "text-[#075e54]" : "text-[#128c7e]"}>
                        {isUser ? "Patient Request" : "Senior Specialist Consultant"}
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap pr-4">
                      {msg.text}
                    </p>

                    {/* Interactive Product Offer Card */}
                    {msg.productCard && (
                      <div className="mt-4 bg-white/95 border border-emerald-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                            <Star size={16} fill="currentColor" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{msg.productCard.name}</h4>
                            <p className="text-emerald-600 font-black text-xs">{msg.productCard.price} • Guaranteed Results</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => onOrderPackageByName(msg.productCard!.name)}
                          className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
                        >
                          {msg.productCard.buttonText}
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}

                    {/* Time & Double Tick Checkmark */}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-400 select-none">
                      <span>{msg.time}</span>
                      {!isUser && (
                        <span className="text-[#53bdeb]">
                          <Check size={14} className="stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fake Bottom Input Bar */}
          <div className="bg-[#f0f2f5] p-3 flex items-center gap-3 relative z-10 border-t border-slate-200">
            <Smile size={22} className="text-slate-500 cursor-pointer hover:text-slate-700 shrink-0" />
            <Paperclip size={20} className="text-slate-500 rotate-45 cursor-pointer hover:text-slate-700 shrink-0" />
            <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-slate-400 border border-slate-200 select-none cursor-pointer">
              Type a message...
            </div>
            <Mic size={22} className="text-slate-500 cursor-pointer hover:text-slate-700 shrink-0" />
          </div>

        </div>
      </div>
      
      {/* Bottom Conversion Section */}
      <div className="bg-emerald-50 p-6 text-center border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-emerald-800 font-extrabold text-sm mb-0.5">Need a similar medical transformation?</p>
          <p className="text-slate-500 text-xs font-medium">Click order inside the chat, or contact our medical panel directly on WhatsApp.</p>
        </div>
        <button
          onClick={() => onOrderPackageByName("Men's Vigor")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-colors shrink-0"
        >
          View Recommended Packages
        </button>
      </div>

    </div>
  );
}
