import { createSlice } from '@reduxjs/toolkit';

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    list: [
      { id: 't1', from: 'Los Angeles, CA', to: 'Las Vegas, NV', start: '2025-07-01', end: '2025-07-03', status: 'completed' }
    ],
    selectedTrip: null
  },
  reducers: {
    addTrip(state, action) { state.list.push(action.payload); },
    setSelectedTrip(state, action) { state.selectedTrip = action.payload; }
  }
});

export const { addTrip, setSelectedTrip } = tripsSlice.actions;
export default tripsSlice.reducer;
