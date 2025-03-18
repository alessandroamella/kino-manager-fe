import { MemberExtended } from '@/types/Member';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { differenceInYears } from 'date-fns';
import { chain } from 'lodash';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

interface UserDataVisualizationsProps {
  users: MemberExtended[];
}

const StatsCharts = ({ users }: UserDataVisualizationsProps) => {
  const { t } = useTranslation();

  // 1. Gender Chart (Pie Chart)
  const genderCounts = users.reduce((acc, user) => {
    acc[user.gender] = (acc[user.gender] || 0) + 1;
    return acc;
  }, {} as { [key in MemberExtended['gender']]: number });

  const genderChartData = {
    labels: Object.keys(genderCounts),
    datasets: [
      {
        label: t('charts.genderDistribution'),
        data: Object.values(genderCounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ], // Example colors
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const ageCounts = new Map();

  users.forEach((user) => {
    const age = differenceInYears(new Date(), user.birthDate); // Calculate age
    ageCounts.set(age, (ageCounts.get(age) || 0) + 1); // Increment count for this age using Map
  });

  // Sort ages for the line chart to be in order
  const sortedAges = Array.from(ageCounts.keys()).sort((a, b) => a - b);
  const ageChartData = {
    labels: sortedAges, // Use individual ages as labels
    datasets: [
      {
        label: t('charts.ageDistribution'),
        data: sortedAges.map((age) => ageCounts.get(age)), // Use counts for each age using Map
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4, // Optional: Add tension for smoother line
        fill: false, // Optional: Remove fill for a cleaner line chart
      },
    ],
  };

  // 3. City Chart (Bar Chart) - Case-insensitive grouping
  const cityCounts = chain(users)
    .filter((user) => !!user.city)
    .groupBy((user) => user.city!.toLowerCase()) // Group by lowercase city
    .mapValues((group) => group.length) // Count items in each group
    .value();

  const cityLabels = chain(users)
    .filter((user) => !!user.city)
    .groupBy((user) => user.city!.toLowerCase())
    .map((group) => group[0].city) // Get the first city name (original case) from each group
    .value();

  const cityChartData = {
    labels: cityLabels, // Use original case labels
    datasets: [
      {
        label: t('charts.cityDistribution'),
        data: Object.values(cityCounts),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <main className="flex gap-4 flex-row flex-wrap justify-center items-center">
      <div className="w-56 m-5">
        <Pie
          data={genderChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: t('charts.genderDistribution'),
              },
            },
          }}
        />
      </div>

      <div className="w-96 m-5">
        <Line
          data={ageChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: t('charts.ageDistribution'),
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: t('charts.numberOfUsers'),
                },
              },
              x: {
                title: {
                  display: true,
                  text: t('charts.ageDistribution'),
                },
              },
            },
          }}
        />
      </div>

      <div className="w-96 m-5">
        <Bar
          data={cityChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: t('charts.cityDistribution'),
              },
            },
            scales: {
              y: {
                ticks: {
                  stepSize: 1,
                },
                beginAtZero: true,
                title: {
                  display: true,
                  text: t('charts.numberOfUsers'),
                },
              },
            },
          }}
        />
      </div>
    </main>
  );
};

export default StatsCharts;
