import Price from '@/components/items/Price';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePurchasesStore from '@/store/purchases';
import { Image, Skeleton } from '@heroui/react';
import { sortBy } from 'lodash-es';
import { useEffect } from 'react';
import { Link } from 'react-router';
import logoDark from '../../assets/images/logo-dark.png';

const KinoMenu = () => {
  const categories = sortBy(
    usePurchasesStore((store) => store.categories),
    'name',
  );

  const fetchItems = usePurchasesStore((store) => store.fetchItems);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <main className="kino-menu min-h-screen bg-gray-900 text-white p-8 pt-0">
      <div className="flex justify-center pt-8 pb-6">
        <Link to="/admin">
          <Image src={logoDark} alt="Kinó Café" className="w-64 mx-auto" />
        </Link>
      </div>
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="min-h-[300px] bg-gray-800 border-gray-700"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-yellow-400">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sortBy(category.items, 'name').map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-white items-center"
                    >
                      <p className="flex flex-col items-start text-lg font-semibold">
                        {item.name}
                        {item.description && (
                          <span className="-mt-1 text-xs font-normal text-gray-400">
                            {item.description}
                          </span>
                        )}
                      </p>
                      <p className="text-lg text-gray-400">
                        <Price price={item.price} round={false} />
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Skeleton>
          <div className="w-full h-96" />
        </Skeleton>
      )}
    </main>
  );
};

export default KinoMenu;
