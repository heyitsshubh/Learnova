"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is Learnova?",
    answer:
      "Learnova is a comprehensive digital classroom platform with tools for effective learning and teaching.",
  },
  {
    question: "Is it paid or free?",
    answer:
      "Learnova offers both free and premium plans, so you can choose the one that best fits your needs.",
  },
  {
    question: "Is my data secure when I use Learnova?",
    answer:
      "Yes. We use industry-standard encryption and privacy protocols to keep your data safe.",
  },
  {
    question: "What is Community?",
    answer:
      "Community is a space where learners and educators connect, share resources, and collaborate.",
  },
  {
    question: "Is AI Assistant free or paid?",
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
    <section
      id="FAQs"
      className="bg-gray-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">

          {/* Left Heading */}
          <div className="flex items-start">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              Frequently
              <br />
              Asked
              <br />
              Questions
            </h2>
          </div>

          {/* FAQ */}
          <div className="md:col-span-2">

            <div className="flex justify-end mb-6">
              <button
                onClick={expandAll}
                className="text-sm sm:text-base text-gray-700 hover:underline"
              >
                {openIndex === "all" ? "Collapse all" : "Expand all"}
              </button>
            </div>

            <div className="divide-y divide-gray-300">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="py-5"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex items-center justify-between w-full gap-4 text-left"
                  >
                    <span className="text-lg sm:text-xl md:text-2xl font-medium">
                      {faq.question}
                    </span>

                    {openIndex === index || openIndex === "all" ? (
                      <Minus className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 flex-shrink-0" />
                    )}
                  </button>

                  {(openIndex === index || openIndex === "all") && (
                    <p className="mt-4 text-gray-600 text-base sm:text-lg leading-7 pr-8">
                      {faq.answer}
                    </p>
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