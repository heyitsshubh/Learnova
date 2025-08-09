import { Video, ClipboardList, Cloud, MessageCircle, BarChart2, Smartphone } from "lucide-react";

const features = [
  {
    icon: <Video className="w-7 h-7 text-black" />,
    title: "HD Video CLasses",
    description:
      "Crystal-clear video conferencing with advanced features like screen sharing, breakout rooms, and interactive whiteboards.",
  },
  {
    icon: <ClipboardList className="w-7 h-7 text-black" />,
    title: "Smart Assignments",
    description:
      "AI-powered assignment creation, automatic grading, and detailed analytics to track student progress and performance.",
  },
  {
    icon: <Cloud className="w-7 h-7 text-black" />,
    title: "Cloud Library",
    description:
      "Unlimited cloud storage for resources, documents, and multimedia content with intelligent organization and search.",
  },
  {
    icon: <MessageCircle className="w-7 h-7 text-black" />,
    title: "Real-time Chat",
    description:
      "Instant messaging, group discussions, and an announcement system to keep everyone connected and informed.",
  },
  {
    icon: <BarChart2 className="w-7 h-7 text-black" />,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights into learning progress, engagement metrics, and personalized recommendations for improvement.",
  },
  {
    icon: <Smartphone className="w-7 h-7 text-black" />,
    title: "Mobile Ready",
    description:
      "Seamless experience across all devices with native mobile apps and responsive web design for learning on-the-go.",
  },
];

export default function Features() {
  return (
    <section className="py-16 px-6 md:px-20 bg-[#ADF0CC1A]">
      {/* Section Heading */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold">Why learnOva?</h2>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Experience a comprehensive digital classroom with all the <br /> tools you need
          for effective learning and teaching.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 justify-center">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-gradient-to-b from-[#faf7f5] to-white shadow-sm hover:shadow-lg transition rounded-xl border border-[#E5E7EB] flex flex-col px-6 py-5"
            style={{
              width: 300,
              height: 220,
              boxShadow: "0px 2px 8px 0px #E5E9F2",
              background: "linear-gradient(180deg, #FAF7F5 0%, #FFFFFF 100%)",
            }}
          >
            <div className="mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
            <p className="text-sm text-gray-700 mt-2">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}