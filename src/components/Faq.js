"use client";
import * as Accordion from "@radix-ui/react-accordion";
import Plus from "../assets/Plus.svg";
import { useSelector } from "react-redux";

const Faq = () => {
  const { skillnaavData } = useSelector((state) => state.root);

  if (!skillnaavData || !skillnaavData.faq || skillnaavData.faq.length === 0) {
    return null;
  }

  const { faqheading, faqsubheading } = skillnaavData.faq[0];
  const { faqcard } = skillnaavData;

  return (
    <div
      id="faqs"
      className="flex flex-col w-full py-10 sm:py-12 lg:py-[60px] lg:flex-row lg:gap-x-8 scroll-mt-28 lg:scroll-mt-32 mb-10 lg:mb-16"
    >
      <div className="lg:w-1/3 py-2 sm:py-4 lg:py-[32px] lg:pr-8">
        <h3 className="font-semibold text-[#EB2891] text-xs sm:text-sm lg:text-base tracking-wider uppercase">
          {faqheading}
        </h3>
        <h1 className="font-bold py-2 sm:py-4 text-[#172026] text-2xl sm:text-3xl lg:text-[42px] lg:leading-[52px]">
          {faqsubheading}
        </h1>
      </div>
      <div className="lg:w-2/3 mt-4 lg:mt-0">
        <Accordion.Root
          type="single"
          defaultValue="item-1"
          collapsible
          className="flex flex-col gap-y-3 sm:gap-y-4"
        >
          {faqcard.map((item, index) => (
            <div key={index}>
              <Accordion.Item
                value={`item-${index + 1}`}
                className="bg-[#E3F1FF] p-4 sm:p-5 rounded-xl border border-blue-100 transition-colors"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between text-left py-1 cursor-pointer">
                    <p className="text-left text-[#172026] text-[15px] sm:text-[16px] lg:text-[18px] font-semibold leading-[22px] sm:leading-[24px] break-words pr-2 flex-1">
                      {item.faq}
                    </p>
                    <span className="text-left text-[#172026] ml-2 sm:ml-4 flex-shrink-0">
                      <img
                        src={Plus}
                        alt="Toggle FAQ"
                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-300 transform group-data-[state=open]:rotate-45"
                      />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden">
                  <p className="pt-2.5 text-[#36485C] text-sm sm:text-base leading-relaxed break-words">
                    {item.answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            </div>
          ))}
        </Accordion.Root>
      </div>
    </div>
  );
};

export default Faq;
