import { fetchWithAuth } from './fetchWithAuth';

const API_BASE = 'http://localhost:8000/api';

// ดึงข้อมูลทรัพยากรคลาวด์
export async function getCloudResources() {
  const res = await fetch(`${API_BASE}/resources`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

// สั่งสแกนและกวาดล้าง
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