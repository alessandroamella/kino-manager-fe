import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const categories = [
  { id: 3, name: 'Analcolici' },
  { id: 4, name: 'Alcolici' },
  { id: 7, name: 'Combo' },
];

const items = [
  { id: 0, name: 'Acqua', price: 0.5, categoryId: 3 },
  { id: 1, name: 'Crodino', price: 1, categoryId: 3 },
  { id: 2, name: 'Monster', price: 1.8, categoryId: 3 },
  { id: 3, name: 'Red Bull', price: 2, categoryId: 3 },
  { id: 4, name: 'Coca Cola', price: 1.5, categoryId: 3 },
  { id: 5, name: 'Lemon Soda', price: 1, categoryId: 3 },
  { id: 6, name: 'Estathé Limone', price: 1.5, categoryId: 3 },
  { id: 7, name: 'Estathé Pesca', price: 1.5, categoryId: 3 },
  { id: 8, name: 'Sprite lattina', price: 1.2, categoryId: 3 },
  { id: 9, name: 'Ichnusa 50cl', price: 2.5, categoryId: 4 },
  { id: 10, name: 'Ichnusa', price: 2, categoryId: 4 },
  { id: 11, name: 'Heineken 66cl', price: 2, categoryId: 4 },
  { id: 12, name: 'Moretti 33cl', price: 2, categoryId: 4 },
  { id: 13, name: 'Raffo 33cl', price: 2, categoryId: 4 },
  { id: 17, name: 'Spritz', price: 2, categoryId: 4 },
  { id: 19, name: 'Patate e Spritz', price: 2.5, categoryId: 7 },
  { id: 20, name: 'Taralli e Spritz', price: 2.5, categoryId: 7 },
  { id: 21, name: 'Patate e Gin Lemon', price: 2.5, categoryId: 7 },
  { id: 22, name: 'Taralli e Gin Lemon', price: 2.5, categoryId: 7 },
];

const KinoMenu = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Kinó Café</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Card key={category.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-yellow-400">
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items
                  .filter(
                    (item) => item.categoryId === category.id && item.price,
                  )
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-white items-center"
                    >
                      <span className="text-lg font-semibold">{item.name}</span>
                      <span className="text-lg text-gray-400">
                        €{item.price.toFixed(2)}
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KinoMenu;
