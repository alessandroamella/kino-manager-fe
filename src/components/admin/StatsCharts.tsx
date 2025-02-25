import { Pie } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { differenceInYears } from 'date-fns';
import { MemberExtended } from '@/types/Member';
import { chain, inRange } from 'lodash';

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
  // 1. Gender Chart (Pie Chart)
  const genderCounts = users.reduce((acc, user) => {
    acc[user.gender] = (acc[user.gender] || 0) + 1;
    return acc;
  }, {} as { [key in MemberExtended['gender']]: number });

  const genderChartData = {
    labels: Object.keys(genderCounts),
    datasets: [
      {
        label: 'Gender Distribution',
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

  const genderChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Gender Distribution',
      },
    },
  };

  // 2. Age Chart (Bar Chart - grouped by age ranges)
  const ageRanges = {
    '0-16': 0,
    '17-18': 0,
    '18-19': 0,
    '20-23': 0,
    '24-28': 0,
    '29+': 0,
  };
  const ageRangesArr = Object.keys(ageRanges).map((key) =>
    key.replace('+', '-Infinity').split('-').map(Number),
  );

  users.forEach((user) => {
    const age = differenceInYears(new Date(), user.birthDate); // Calculate age

    const range = ageRangesArr.find(([min, max]) => inRange(age, min, max));
    if (range) {
      const key = `${range[0]}-${
        Math.abs(range[1]) === Infinity ? '+' : range[1]
      }`;
      ageRanges[key as keyof typeof ageRanges] += 1;
    }
  });

  const ageChartData = {
    labels: Object.keys(ageRanges),
    datasets: [
      {
        label: 'User Age Distribution',
        data: Object.values(ageRanges),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const ageChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Age Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Users',
        },
      },
    },
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
        label: 'User Distribution by City',
        data: Object.values(cityCounts),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const cityChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Distribution by City',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Users',
        },
      },
    },
  };

  return (
    <main className="flex gap-4 flex-row flex-wrap justify-center items-center">
      <div className="w-56 m-5">
        <Pie data={genderChartData} options={genderChartOptions} />
      </div>

      <div className="w-96 m-5">
        <Bar data={ageChartData} options={ageChartOptions} />
      </div>

      <div className="w-96 m-5">
        <Bar data={cityChartData} options={cityChartOptions} />
      </div>
    </main>
  );
};

export default StatsCharts;
