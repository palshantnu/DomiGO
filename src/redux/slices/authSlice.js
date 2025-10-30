import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// mock async login action (replace with real API)
export const login = createAsyncThunk('auth/login', async ({ email, password }) => {

  await new Promise(res => setTimeout(res, 500));

  return { id: 'u1', name: 'J Wilkes', email };
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null },
  reducers: {
    logout(state) { state.user = null; }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, (s) => { s.status = 'loading'; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload; })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
