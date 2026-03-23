import axios from 'axios';

const kimi = axios.create({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 120_000, // 2 minute timeout
  headers: {
    'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export default kimi;
