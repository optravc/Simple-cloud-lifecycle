import { fetchWithAuth } from './fetchWithAuth';

export const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://backend:8080/api');
export const S3_BASE_URL = 'https://simeple-cloud-lifecylce-demo-storage.s3.ap-southeast-7.amazonaws.com/';

// Fetch cloud resources data
export async function getCloudResources() {
  const res = await fetch(`${API_BASE}/resources`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}


export async function triggerScanAndSweep() {
  const res = await fetch(`${API_BASE}/scan`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function getRecentCharges() {
  const res = await fetch(`${API_BASE}/charges`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function getCostAllocationData(department = 'All', tag = 'All') {
  const query = new URLSearchParams({ department, tag }).toString();
  const res = await fetchWithAuth(`${API_BASE}/cost-allocation?${query}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

// Fetch performance metrics from CloudWatch via Backend
export async function getPerformanceData() {
  const res = await fetchWithAuth(`${API_BASE}/performance`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

// Fetch budget and budgeting data
export async function getBudgets() {
  const res = await fetchWithAuth(`${API_BASE}/budgets`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

// Update budget of a department Cost Center
export async function updateBudget(id: number, budget: number) {
  const res = await fetchWithAuth(`${API_BASE}/budgets/update`, {
    method: 'POST',
    body: JSON.stringify({ id, budget }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}


export async function getProjectBreakdown(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/project-breakdown?id=${id}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}