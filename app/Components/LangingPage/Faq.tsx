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
    <section className="py-16 px-6 md:px-20 bg-gray-50">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left side heading */}
        <div>
          <h2 className="text-xl font-bold leading-snug">
            Frequently <br /> Asked <br /> Questions
          </h2>
        </div>

        {/* Right side FAQs */}
        <div className="md:col-span-2">
          <div className="flex justify-end mb-4">
            <button
              onClick={expandAll}
              className="text-sm text-gray-600 hover:underline"
            >
              Expand all
            </button>
          </div>

          <div className="divide-y">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex justify-between items-center w-full text-left"
                >
                  <span className="text-gray-800">{faq.question}</span>
                  {openIndex === index || openIndex === "all" ? (
                    <Minus className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {(openIndex === index || openIndex === "all") && (
                  <p className="mt-2 text-gray-600 text-sm">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
