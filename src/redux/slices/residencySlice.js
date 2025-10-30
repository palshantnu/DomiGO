import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  states: [
    { code: 'CA', name: 'California', days: 180, wages: 85000, risk: 'green' },
    { code: 'NY', name: 'New York', days: 170, wages: 91000, risk: 'amber' },
    { code: 'UT', name: 'Utah', days: 45, wages: 45000, risk: 'red' },
  ],
  selectedState: null,
};

const residencySlice = createSlice({
  name: 'residency',
  initialState,
  reducers: {
    setSelectedState(state, action) { state.selectedState = action.payload; },
    addResidencyRecord(state, action) { state.states.push(action.payload); }
  }
});

export const { setSelectedState, addResidencyRecord } = residencySlice.actions;
export default residencySlice.reducer;
