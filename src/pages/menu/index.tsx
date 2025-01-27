import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePurchasesStore from '@/store/purchases';
import useUserStore from '@/store/user';
import { Image, Skeleton } from '@heroui/react';
import { useEffect, useRef } from 'react';
import logoDark from '../../assets/images/logo-dark.png';

const KinoMenu = () => {
  const categories = usePurchasesStore((store) => store.categories);

  const accessToken = useUserStore((store) => store.accessToken);
  const fetchItems = usePurchasesStore((store) => store.fetchItems);

  const isFetching = useRef(false);

  useEffect(() => {
    if (!accessToken || isFetching.current) {
      return;
    }
    isFetching.current = true;
    fetchItems(accessToken);
  }, [accessToken, fetchItems]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pt-0">
      {/* <h1 className="text-4xl font-bold mb-8 text-center">Kinó Café</h1> */}
      <div className="flex justify-center py-2">
        <Image src={logoDark} alt="Kinó Café" className="w-64 mx-auto" />
      </div>
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="min-h-[400px] bg-gray-800 border-gray-700"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-yellow-400">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item) => (
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
                        €{item.price.toFixed(2)}
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
    </div>
  );
};

export default KinoMenu;
