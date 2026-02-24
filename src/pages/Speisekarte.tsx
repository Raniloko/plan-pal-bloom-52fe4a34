import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const menuData = [
  {
    category: "Burger – inkl. Beilagen",
    items: [
      { name: "Rondo Smash Burger", desc: "Rindfleisch Patty, Salat, Tomaten, Gewürzgurken, karamellisierte Zwiebeln", note: "Menü mit Pommes + Softdrink für 14.50 €", price: "8,00 €" },
      { name: "Veggie Burger", desc: "Gemüse Patty, Salat, Tomaten, Gewürzgurken, karamellisierte Zwiebeln", note: "Menü mit Pommes + Softdrink für 14.50 €", price: "8,00 €", badge: "vegetarisch" },
      { name: "Rondo Chicken Burger", desc: "Hähnchen Patty, Salat, Tomaten, Gewürzgurken, karamellisierte Zwiebeln", note: "Menü mit Pommes + Softdrink für 14.50 €", price: "8,00 €" },
      { name: "Rondo Smash Cheese Burger", desc: "Rindfleisch Patty, Käse, Salat, Tomaten, Gewürzgurken, karamellisierte Zwiebeln", note: "Menü mit Pommes + Softdrink für 14.50 €", price: "8,50 €" },
    ],
  },
  {
    category: "Teller",
    items: [
      { name: "Rondo Teller", desc: "Nuggets, Mozzarella Sticks, Onion Rings, Pommes", price: "12,00 €" },
      { name: "Nuggets Teller", desc: "Nuggets, Pommes", price: "7,50 €" },
      { name: "Rindswurst Teller", desc: "Rindswurst, Pommes", price: "7,00 €" },
      { name: "Chicken Wings Teller", desc: "Chicken Wings, Pommes", price: "7,00 €" },
    ],
  },
  {
    category: "Sides",
    items: [
      { name: "Rondo Fries", price: "4,00 €" },
      { name: "Mozzarella Sticks", price: "4,00 €" },
      { name: "Onion Rings", price: "4,00 €" },
      { name: "Tortilla Chips und Dips", desc: "Mais-Tortilla Chips dazu Salsa Dip (mild) und Cheese Dip", price: "7,90 €" },
      { name: "Tortilla Nachos Überbacken", desc: "Mais-Tortilla Chips mit Jalapeños und Käse dazu Salsa Dip, Cheese (mild) und Cheese Dip", price: "8,90 €" },
    ],
  },
];

const badgeColors: Record<string, string> = {
  vegetarisch: "bg-green-600/20 text-green-400",
};

const Speisekarte = () => {
  return (
    <main className="pt-20 md:pt-24">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-7xl mb-4">
              Food & <span className="text-primary">Drinks</span>
            </h1>
          </div>

          <Accordion type="multiple" className="space-y-3">
            {menuData.map((section, sIdx) => (
              <AccordionItem
                key={sIdx}
                value={`section-${sIdx}`}
                className="border border-primary rounded-none bg-transparent"
              >
                <AccordionTrigger className="px-5 py-4 font-display text-xl md:text-2xl uppercase tracking-wider hover:no-underline hover:text-primary">
                  {section.category}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="space-y-4">
                    {section.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex justify-between items-start gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className={`text-xs px-2 py-0.5 rounded ${badgeColors[item.badge] || ""}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.desc}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-primary/70 mt-1 italic">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-display text-lg text-primary whitespace-nowrap">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">🌿 vegetarisch</span>
            <span className="flex items-center gap-1.5">🌱 vegan</span>
            <span className="flex items-center gap-1.5">💚 homemade</span>
            <span className="flex items-center gap-1.5">🌶️ leicht scharf</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Speisekarte;
