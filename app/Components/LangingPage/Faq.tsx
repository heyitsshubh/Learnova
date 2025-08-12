"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is learnova?",
    answer:
      "Learnova is a comprehensive digital classroom platform with tools for effective learning and teaching.",
  },
  {
    question: "Is it paid or free?",
    answer:
      "Learnova offers both free and premium plans, so you can choose the one that best fits your needs.",
  },
  {
    question: "Is my data secure when I use learnova?",
    answer:
      "Yes. We use industry-standard encryption and privacy protocols to keep your data safe.",
  },
  {
    question: "What is community?",
    answer:
      "Community is a space where learners and educators connect, share resources, and collaborate.",
  },
  {
    question: "Is AI assistant free or paid?",
    answer:
      "The AI assistant has basic free features, with advanced tools available in paid plans.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | "all" | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const expandAll = () => {
    setOpenIndex(openIndex === "all" ? null : "all");
  };

  return (
    <section id= "FAQs" className="py-16 px-2 md:px-0 bg-gray-50 min-h-screen flex items-center justify-center w-full">
      <div className="w-full max-w-[1440px]">
        <div className="grid md:grid-cols-3 gap-0 w-full">
          {/* Left side heading */}
          <div className="flex items-start justify-center md:justify-start py-8 pl-8">
            <h2 className="text-1xl md:text-5xl font-semibold leading-snug text-black mb-80">
              Frequently <br /> Asked <br /> Questions
            </h2>
          </div>

          {/* Right side FAQs */}
          <div className="md:col-span-2 flex flex-col justify-center w-full">
            <div className="flex justify-end mb-4 pr-8">
              <button
                onClick={expandAll}
                className="text-lg text-gray-700 hover:underline"
              >
                Expand all
              </button>
            </div>

            <div className="divide-y divide-gray-300 mb-80">
              {faqs.map((faq, index) => (
                <div key={index} className="py-6 px-8">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <span className="text-xl md:text-2xl text-black ">{faq.question}</span>
                    {openIndex === index || openIndex === "all" ? (
                      <Minus className="w-6 h-6 text-black" />
                    ) : (
                      <Plus className="w-6 h-6 text-black" />
                    )}
                  </button>

                  {(openIndex === index || openIndex === "all") && (
                    <p className="mt-3 text-lg md:text-xl text-black">{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}