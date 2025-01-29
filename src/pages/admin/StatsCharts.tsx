import { Pie } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
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
import { differenceInYears, format } from 'date-fns';
import { MemberExtended } from '@/types/Member';

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
    '18-24': 0,
    '25-34': 0,
    '35-44': 0,
    '45-54': 0,
    '55+': 0,
  };

  users.forEach((user) => {
    const age = differenceInYears(new Date(), user.birthDate); // Calculate age

    if (age >= 18 && age <= 24) {
      ageRanges['18-24']++;
    } else if (age >= 25 && age <= 34) {
      ageRanges['25-34']++;
    } else if (age >= 35 && age <= 44) {
      ageRanges['35-44']++;
    } else if (age >= 45 && age <= 54) {
      ageRanges['45-54']++;
    } else if (age >= 55) {
      ageRanges['55+']++;
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

  // 3. City Chart (Bar Chart)
  const cityCounts = users
    .filter((e) => e.city)
    .reduce((acc, user) => {
      acc[user.city!] = (acc[user.city!] || 0) + 1;
      return acc;
    }, {} as { [city: string]: number });

  const cityChartData = {
    labels: Object.keys(cityCounts),
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

  // 4. Registered Date Chart (Line Chart - showing trends over time)
  const registrationCounts = users.reduce((acc, user) => {
    const registrationMonth = format(user.createdAt, 'MMM yyyy'); // Group by month and year
    acc[registrationMonth] = (acc[registrationMonth] || 0) + 1;
    return acc;
  }, {} as { [monthYear: string]: number });

  const sortedRegistrationMonths = Object.keys(registrationCounts).sort(
    (a, b) => {
      // Sort months chronologically
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(
        new Date(Date.parse(`${monthB} 1, ${yearB}`)).getMonth(),
        new Date(Date.parse(`${monthA} 1, ${yearA}`)).getMonth(),
      );
      const dateB = new Date(
        new Date(Date.parse(`${monthA} 1, ${yearA}`)).getMonth(),
        new Date(Date.parse(`${monthB} 1, ${yearB}`)).getMonth(),
      );
      return dateA.getTime() - dateB.getTime();
    },
  );

  const registrationChartData = {
    labels: sortedRegistrationMonths,
    datasets: [
      {
        label: 'User Registrations Over Time',
        data: sortedRegistrationMonths.map(
          (month) => registrationCounts[month],
        ),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1, // For smoother lines
      },
    ],
  };

  const registrationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Registrations Over Time',
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
      x: {
        title: {
          display: true,
          text: 'Registration Month',
        },
      },
    },
  };

  return (
    <div>
      <h2>User Data Visualizations</h2>

      <div style={{ width: '400px', margin: '20px' }}>
        <Pie data={genderChartData} options={genderChartOptions} />
      </div>

      <div style={{ width: '600px', margin: '20px' }}>
        <Bar data={ageChartData} options={ageChartOptions} />
      </div>

      <div style={{ width: '600px', margin: '20px' }}>
        <Bar data={cityChartData} options={cityChartOptions} />
      </div>

      <div style={{ width: '800px', margin: '20px' }}>
        <Line data={registrationChartData} options={registrationChartOptions} />
      </div>
    </div>
  );
};

export default StatsCharts;
