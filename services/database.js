
export async function addTrade(newTrade, callback) {
  const formData = new FormData();


  for (const [key, value] of Object.entries(newTrade)) {
    if (key === 'entry_snapshot') continue; 
    formData.append(key, value ?? '');
  }

 
  if (newTrade.entry_snapshot instanceof File) {

    formData.append('entry_snapshot', newTrade.entry_snapshot, newTrade.entry_snapshot.name);
  }

  const response = await fetch('/trades', {
    method: 'POST',
    body: formData,
   
  });

  const result = await response.json();
  if (callback) callback(result.id);
  return result;
}

export async function updateTradeExit(tradeId, { exitPrice, exitSize, exitTime, exitSnapshot, prevExitSnapshot }) {
  const formData = new FormData();
  formData.append('exit_time', exitTime);
  formData.append('exit_price', exitPrice);
  formData.append('exit_size', exitSize);

  if (exitSnapshot instanceof File) {
    formData.append('exit_snapshot', exitSnapshot);
  } else if (prevExitSnapshot) {

    formData.append('prev_exit_snapshot', prevExitSnapshot);
  }

  const res = await fetch(`/trades/${tradeId}`, {
    method: 'PUT',
    body: formData,
  });
  const data = await res.json();
  return data;
}
