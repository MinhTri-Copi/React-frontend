import axios from 'axios';

const getDashboardStatistics = async (userId, timeRange = '6months') => {
    try {
        const res = await axios.get(`http://localhost:8082/api/hr/statistics/dashboard?userId=${userId}&timeRange=${timeRange}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        throw error;
    }
};

const getApplicationTrends = async (userId, days = 30) => {
    try {
        const res = await axios.get(`http://localhost:8082/api/hr/statistics/trends?userId=${userId}&days=${days}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching application trends:', error);
        throw error;
    }
};

export { 
    getDashboardStatistics,
    getApplicationTrends
};

