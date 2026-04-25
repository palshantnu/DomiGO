import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import CustomScroll from '../components/CustomScroll';
import { GET_MONTH_WISE_TIMELINE, GET_WEEK_WISE_TIMELINE, GET_YEAR_WISE_TIMELINE, GET_MISSING_ACTIVITY_LIST } from '../redux/actions/action-creator';
import { connect } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

function CalendarScreen({ navigation, GET_MONTH_WISE_TIMELINE, GET_WEEK_WISE_TIMELINE, GET_YEAR_WISE_TIMELINE, GET_MISSING_ACTIVITY_LIST, missingActivityList, yearWiseTimeline, weekWiseTimeline, monthWiseTimeline }) {
  const [selectedTab, setSelectedTab] = useState('Month');
  const [selectedResidencyType, setSelectedResidencyType] = useState('past');
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [openWeekIndex, setOpenWeekIndex] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [selectedMissingDate, setSelectedMissingDate] = useState(null);
  const [dayActionModalVisible, setDayActionModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearOptions = useMemo(() => {
    return [
      currentYear - 2,
      currentYear - 1,
      currentYear,
    ];
  }, []);
  const today = new Date();

  // const parseLocalDate = (dateStr) => {
  //   const [y, m, d] = dateStr.split('-').map(Number);
  //   return new Date(y, m - 1, d);
  // };
  // const parseLocalDate = (dateInput) => {
  //   if (!dateInput) return new Date(); // fallback

  //   // अगर already Date hai → return as it is
  //   if (dateInput instanceof Date) return dateInput;

  //   // अगर string hai
  //   if (typeof dateInput === 'string') {
  //     const parts = dateInput.split('-');
  //     if (parts.length === 3) {
  //       const [y, m, d] = parts.map(Number);
  //       return new Date(y, m - 1, d);
  //     }
  //   }

  //   // fallback
  //   return new Date(dateInput);
  // };

  const parseLocalDate = (input) => {
    if (!input) return new Date();
  
    if (input instanceof Date) return input;
  
    if (typeof input === "string") {
      if (input.includes("T")) {
        return new Date(input); // ISO safe
      }
  
      const [y, m, d] = input.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
  
    return new Date(input);
  };

  const [visibleMonth, setVisibleMonth] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  console.log('yearWiseTimeline', yearWiseTimeline);
  console.log('weekWiseTimeline', weekWiseTimeline);
  console.log('monthWiseTimeline', monthWiseTimeline);
  console.log('missingActivityList', missingActivityList);

  const getCurrentWeekDates = () => {
    const today = new Date();

    // Clone date to avoid mutation
    const current = new Date(today);

    // Get day (0 = Sunday, 1 = Monday ...)
    const day = current.getDay();

    // Monday as start of week
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);


    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
    
      return `${y}-${m}-${d}`;
    };

    // const formatDate = (date) =>
    //   date.toLocaleDateString("en-CA").split('T')[0]; // YYYY-MM-DD

    return {
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek),
    };
  };



  useEffect(() => {
    const today = new Date();
    const { start, end } = getCurrentWeekDates();

    GET_WEEK_WISE_TIMELINE({ start, end });;
    GET_YEAR_WISE_TIMELINE({ year: selectedYear });
    GET_MONTH_WISE_TIMELINE({
      month: today.getMonth() + 1, // JS months 0-based
      year: today.getFullYear(),
    });
    GET_MISSING_ACTIVITY_LIST()
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const today = new Date();
      const { start, end } = getCurrentWeekDates();

      GET_WEEK_WISE_TIMELINE({ start, end });;
      GET_YEAR_WISE_TIMELINE({ year: selectedYear });
      GET_MONTH_WISE_TIMELINE({
        month: today.getMonth() + 1, // JS months 0-based
        year: today.getFullYear(),
      });
      GET_MISSING_ACTIVITY_LIST();
    }, [])
  );

  const onYearSelect = (year) => {
    setSelectedYear(year);
    setShowYearDropdown(false);

    // 🔁 Redux call
    GET_YEAR_WISE_TIMELINE({ year });
  };


  const STATE_COLOR_MAP = {
    "Madhya Pradesh": "#28a0dd",
    "Uttar Pradesh": "#34c759",
    "Delhi": "#5ac8fa",
    "California": "#a5f1a9",
    "Arizona": "#1d3b73",
  };

  const TRIP_DOT = { key: "trip", color: "#9E9E9E" };     // Grey
  const ADD_MISSING_DOT = { key: "add-missing", color: "#FF3B30" }; // Red
  const EDIT_MISSING_DOT = { key: "edit-missing", color: "#FFCC00" }; // Yellow
  const REEDIT_MISSING_DOT = { key: "reedit-missing", color: "#007AFF" }; // Blue

  const MISSING_DOT = {
    key: 'missing',
    color: '#FF3B30',   // red-ish (attention)
  };

  const TODAY_MISSING_DOT = {
    key: 'missing-today',
    color: '#FF9500', // orange
  };
  // const isWeekend = (dateStr) => {
  //   const day = new Date(dateStr).getDay();
  //   return day === 0 || day === 6; // Sunday or Saturday
  // };
  const isWeekend = (dateStr) => {
    const date = parseLocalDate(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  // const getMarkedDates = (monthWiseTimeline, year, month) => {
  //   const marked = {};

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const daysInMonth = new Date(year, month, 0).getDate();

  //   for (let day = 1; day <= daysInMonth; day++) {
  //     const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  //     const trips = monthWiseTimeline?.[dateStr] || [];

  //     const dots = [];

  //     const currentDate = new Date(dateStr);
  //     currentDate.setHours(0, 0, 0, 0);

  //     // 1️⃣ State dots (agar trips hain)
  //     if (trips.length > 0) {
  //       const uniqueStates = [
  //         ...new Set(trips.map(t => t.destinationState)),
  //       ];

  //       uniqueStates.forEach(state => {
  //         dots.push({
  //           key: state,
  //           // color: STATE_COLOR_MAP[state] || '#999',
  //           color: '#999',
  //         });
  //       });
  //     }

  //     // 2️⃣ Manual (red) dot — past + today (ALWAYS)
  //     if (currentDate <= today) {
  //       dots.push(MISSING_DOT);
  //     }
  //     marked[dateStr] = { dots };

  //     const weekend = isWeekend(dateStr);

  //     marked[dateStr] = {
  //       dots,
  //       ...(weekend && {
  //         customStyles: {
  //           text: {
  //             color: '#D32F2F', // weekend text color
  //             fontWeight: '600',
  //           },
  //           container: {
  //             backgroundColor: '#FFF5F5', // light red / grey
  //             borderRadius: 8,
  //           },
  //         },
  //       })
  //     }
  //   }


  //   return marked;
  // };
  const isActuallyEdited = (item) => {
    if (!item.updatedAt || !item.createdAt) return false;

    const created = new Date(item.createdAt);
    const updated = new Date(item.updatedAt);

    const diffInSeconds = (updated - created) / 1000;

    return diffInSeconds > 12000; // 2 minute se zyada ho toh edited
  };

  const getMarkedDates = (monthWiseTimeline, year, month) => {
    const marked = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = monthWiseTimeline?.[dateStr] || [];

      // const currentDate = new Date(dateStr);
      const currentDate = parseLocalDate(dateStr);
      currentDate.setHours(0, 0, 0, 0);

      const dots = [];

      // ❌ Future date → skip
      if (currentDate > today) {
        marked[dateStr] = { dots: [] };
        continue;
      }

      const trips = dayData.filter(d => d.kind === "trip");
      const missing = dayData
        .filter(d => d.kind === "missing")
        // .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        .sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt))[0];


      // ===============================
      // 🔵 PRIORITY LOGIC
      // ===============================

      console.log('missing>>>>', missing);

      if (trips.length > 0) {
        dots.push(TRIP_DOT);
      }

      if (!missing) {
        // ➕ Missing not added yet
        dots.push(ADD_MISSING_DOT);
      } else {
        // if (isActuallyEdited(missing)) {
        if (missing.isUpdated) {
          // 🔁 Re-edit
          dots.push(REEDIT_MISSING_DOT);
        } else {
          // ✏️ Edit
          dots.push(EDIT_MISSING_DOT);
        }
      }

      marked[dateStr] = { dots };
    }

    return marked;
  };

  const getMissingFromMonth = (monthWiseTimeline, dateKey) => {
    const dayData = monthWiseTimeline?.[dateKey] || [];
    return dayData.find(item => item.kind === "missing") || null;
  };

  const missingMap = useMemo(() => {
    const map = {};
    (missingActivityList || []).forEach(item => {
      const dateKey = item.date.split('T')[0]; // 2026-01-04
      map[dateKey] = item;
    });
    return map;
  }, [missingActivityList]);

  const missingDataForDay = missingMap[selectedDate];

  console.log('missingDataForDay', missingDataForDay);
  // const isMissingAlreadyAdded = !!missingDataForDay;
  const isMissingAlreadyAdded = !!selectedMissingDate;


  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (tripModalVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [tripModalVisible]);

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTripModalVisible(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // const today = new Date();

  // const markedDates = useMemo(
  //   () =>
  //     getMarkedDates(
  //       monthWiseTimeline,
  //       today.getFullYear(),
  //       today.getMonth() + 1
  //     ),
  //   [monthWiseTimeline]
  // );
  const markedDates = useMemo(
    () =>
      getMarkedDates(
        monthWiseTimeline,
        visibleMonth.year,
        visibleMonth.month
      ),
    [monthWiseTimeline, visibleMonth]
  );

  // const handleDayPress = (day) => {
  //   const dateKey = day.dateString;
  //   const tripsForDay = monthWiseTimeline?.[dateKey] || [];

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const currentDate = new Date(dateKey);
  //   currentDate.setHours(0, 0, 0, 0);

  //   // ❌ Future date → kuch nahi
  //   if (currentDate > today) return;

  //   // ✅ Store context
  //   setSelectedDate(dateKey);
  //   setSelectedTrips(tripsForDay);

  //   // ✅ Always open same modal
  //   setDayActionModalVisible(true);
  // };



  const handleDayPress = (day) => {
    const dateKey = day.dateString;
    const dayData = monthWiseTimeline?.[dateKey] || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // const currentDate = new Date(dateKey);
    const currentDate = parseLocalDate(dateKey);
    currentDate.setHours(0, 0, 0, 0);

    // ❌ Future date block
    if (currentDate > today) return;

    // ✅ TRIPS
    const trips = dayData.filter(d => d.kind === "trip");

    // ✅ MISSING (LATEST ONE)
    const missingEntry = [...dayData]
      .filter(d => d.kind === "missing")
      // .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      .sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt))[0];

    // 🔥 STORE STATE
    setSelectedDate(dateKey);
    setSelectedTrips(trips);
    setSelectedMissingDate(missingEntry || null);

    setDayActionModalVisible(true);
  };




  useEffect(() => {
    console.log('Modal visible changed 👉', tripModalVisible);
  }, [tripModalVisible])


  const getLegendStates = (monthWiseTimeline) => {
    const result = monthWiseTimeline || {};
    const stateSet = new Set();

    Object.values(result).forEach(dayArray => {
      dayArray.forEach(item => {
        if (item.destinationState) {
          stateSet.add(item.destinationState);
        }
      });
    });

    return Array.from(stateSet);
  };

  const legendStates = getLegendStates(monthWiseTimeline);

  // const getWeekCalendarData = (weekResult = {}) => {
  //   return Object.keys(weekResult).map(date => {
  //     // const trips = weekResult[date];
  //     const entry = weekResult[date];

  //     const trips =
  //     entry?.type === "trip" && entry?.data
  //       ? [entry.data]
  //       : [];

  //     const formattedDate = new Date(date).toLocaleDateString('en-IN', {
  //       day: '2-digit',
  //       month: 'short',
  //     });

  //     const day = new Date(date).toLocaleDateString('en-US', {
  //       weekday: 'short',
  //     });

  //     // Build locations list like image
  //     const locations = [];

  //     trips?.forEach(trip => {
  //       // Origin
  //       locations.push({
  //         type: 'origin',
  //         city: trip.originCity,
  //         state: trip.originState,
  //       });

  //       // Destination
  //       locations.push({
  //         type: 'destination',
  //         city: trip.destinationCity,
  //         state: trip.destinationState,
  //         id: trip.id,
  //       });
  //     });

  //     return {
  //       date,
  //       formattedDate,
  //       day,
  //       locations,
  //     };
  //   });
  // };

  const normalizeDayData = (dayData = []) => {
    // console.log('dayData',dayData);
    const trips = [];
    let latestMissing = null;

    dayData.forEach(item => {
      if (item.kind === "trip") {
        trips.push(item);
      }

      if (item.kind === "missing") {
        if (
          !latestMissing ||
          // new Date(item.createdAt) > new Date(latestMissing.createdAt)
          parseLocalDate(item.createdAt) > new Date(latestMissing.createdAt)
        ) {
          latestMissing = item;
        }
      }
    });

    return { trips, latestMissing };
  };

  const getWeekCalendarData = (weekResult = {}) => {
    return Object.keys(weekResult)
      .map(date => {
        const { trips, latestMissing } = normalizeDayData(weekResult[date]);

        // 🔥 agar na trip hai na missing → skip
        if (trips.length === 0 && !latestMissing) return null;

        return {
          date,
          // formattedDate: new Date(date).toLocaleDateString('en-IN', {
          formattedDate: parseLocalDate(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
          // day: new Date(date).toLocaleDateString('en-US', {
          day: parseLocalDate(date).toLocaleDateString('en-US', {
            weekday: 'short',
          }),
          trips,
          missing: latestMissing,
        };
      })
      .filter(Boolean);
  };






  const getWeekKey = (dateStr) => {
    // const date = new Date(dateStr);
    const date = parseLocalDate(dateStr);
    const start = new Date(date);
    // const start = parseLocalDate(date);
    start.setDate(date.getDate() - date.getDay()); // Sunday
    const end = new Date(start);
    // const end = parseLocalDate(date);
    end.setDate(start.getDate() + 6);

    const format = d =>
      d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return `${format(start)} - ${format(end)}`;
  };

  // const getWeekKey = (dateStr) => {
  //   const date = parseLocalDate(dateStr);
  
  //   const day = date.getDay();
  
  //   // ✅ Monday start fix
  //   const diff = day === 0 ? -6 : 1 - day;
  
  //   const start = new Date(date);
  //   start.setDate(date.getDate() + diff);
  
  //   const end = new Date(start);
  //   end.setDate(start.getDate() + 6);
  
  //   const format = d =>
  //     d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  
  //   return `${format(start)} - ${format(end)}`;
  // };




  // const normalizeYearData = (yearWiseTimeline = {}) => {
  //   const normalized = {};

  //   Object.entries(yearWiseTimeline).forEach(([date, value]) => {
  //     console.log(
  //       "API KEY:", date,
  //       "Parsed:", new Date(date).toLocaleDateString("en-CA").split("T")[0]
  //     );
  //     if (!normalized[date]) {
  //       normalized[date] = {
  //         trips: [],
  //         activity: null,
  //       };
  //     }

  //     if (value.type === "trip") {
  //       normalized[date].trips.push(value.data);
  //     }

  //     if (value.type === "activity") {
  //       normalized[date].activity = value.data;
  //     }
  //   });

  //   return normalized;
  // };

  // const normalizeYearData = (yearWiseTimeline = {}) => {
  //   const normalized = {};

  //   Object.entries(yearWiseTimeline).forEach(([date, value]) => {
  //     console.log('value>>>>>>',value);
  //     if (!normalized[date]) {
  //       normalized[date] = {
  //         trips: [],
  //         activity: null,
  //       };
  //     }

  //     // 🟢 TRIP
  //     if (value?.type === "trip" && value?.data) {
  //       normalized[date].trips.push(value.data);
  //     }

  //     // 🟠 ACTIVITY
  //     if (value?.type === "activity" && value?.data) {
  //       normalized[date].activity = value.data;
  //     }
  //   });

  //   return normalized;
  // };

  const normalizeYearData = (yearWiseTimeline = {}) => {
    const normalized = {};

    Object.entries(yearWiseTimeline).forEach(([date, items]) => {
      normalized[date] = {
        trips: [],
        activity: null,
      };

      if (!Array.isArray(items)) return;

      items.forEach(item => {
        if (item.kind === "trip") {
          normalized[date].trips.push(item);
        }

        if (item.kind === "missing") {
          normalized[date].activity = item;
        }
      });
    });

    return normalized;
  };







  const getYearWeeklyData = (normalizedData = {}) => {
    const weekMap = {};

    Object.entries(normalizedData).forEach(([date, dayData]) => {
      const weekKey = getWeekKey(date);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = [];
      }

      weekMap[weekKey].push({
        date,
        ...dayData,
      });
    });

    return Object.keys(weekMap).map((week, index) => ({
      id: index + 1,
      week,
      days: weekMap[week],
    }));
  };


  // const getYearWeeklyData = (yearWiseTimeline = {}) => {
  //   const weekMap = {};

  //   Object.entries(yearWiseTimeline).forEach(([date, trips]) => {
  //     const weekKey = getWeekKey(date);

  //     if (!weekMap[weekKey]) {
  //       weekMap[weekKey] = [];
  //     }

  //     // ✅ FORCE trips to always be an array
  //     const tripArray = Array.isArray(trips) ? trips : trips ? [trips] : [];

  //     weekMap[weekKey].push(...tripArray);
  //   });

  //   return Object.keys(weekMap).map((week, index) => ({
  //     id: index + 1,
  //     week,
  //     trips: weekMap[week],
  //     color:
  //       STATE_COLOR_MAP[weekMap[week][0]?.destinationState] ||
  //       colors.primary,
  //   }));
  // };


  const normalizedYearData = useMemo(
    () => normalizeYearData(yearWiseTimeline),
    [yearWiseTimeline]
  );
  const weeklyData = useMemo(
    () => getYearWeeklyData(normalizedYearData),
    [normalizedYearData]
  );
  // const weeklyData = getYearWeeklyData(yearWiseTimeline);



  // const weeklyData = useMemo(
  //   () => getYearWeeklyData(normalizedYearData),
  //   [normalizedYearData]
  // );

  const YearWeekCard = ({ item, index }) => {
    const isOpen = openIndex === index;
    console.log('itemmdnfn', item);

    return (
      <View style={styles.cardWrapper}>

        {/* ===== MAIN CARD ROW (UNCHANGED) ===== */}
        <View style={styles.rowContainer}>
          {/* Left color strip */}
          <View
            style={[
              styles.colorStrip,
              { backgroundColor: item.color },
            ]}
          />

          {/* Card content */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              setOpenIndex(isOpen ? null : index)
            }
            style={styles.cardBody}
          >
            {/* Top row */}
            <View style={styles.topRow}>
              <Text style={styles.dateText}>{item.week}</Text>
              {/* <Text style={styles.daysText}>{item.days}</Text> */}
              <Text style={styles.daysText}>{'07 Days'}</Text>
            </View>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <Text style={styles.locationText}>
                {item.location}
              </Text>

              <View style={styles.rightIcons}>
                {item.manual && (
                  <View style={styles.manualTag}>
                    <Text style={styles.manualText}>Manual</Text>
                  </View>
                )}
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color="#9E9E9E"
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* {isOpen && (
          <View style={styles.expandedContainer}>
            {item.trips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripRow}
                onPress={() =>
                  navigation.navigate('DayDetail', trip)
                }
              >
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
               
                <View>
                  <View style={styles.tripLine}>
                    <View style={styles.blueDot} />
                    <Text style={styles.tripText}>
                      {trip.originCity}, {trip.originState}
                    </Text>
                  </View>

                  <View style={styles.tripLine}>
                    <View style={styles.greenDot} />
                    <Text style={styles.tripText}>
                      {trip.destinationCity}, {trip.destinationState}
                    </Text>
                  </View>
                </View>
                <View style={styles.typeRow}>
                  <Ionicons
                    name={
                      trip.creationType === "Business" ? "briefcase-outline" : "leaf-outline"
                    }
                    size={15}
                    color="#4CAF50"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.typeText}>{trip.creationType}</Text>
                </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )} */}
        {isOpen && (
          <View style={styles.expandedContainer}>

            {item.days.map((day, idx) => {
              console.log('dayyyyy', day)
              return (
                <View key={idx} style={{ marginBottom: 12 }}>

                  {/* DATE LABEL */}
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#555" }}>
                    {day.date}
                  </Text>

                  {/* 🚗 TRIPS */}
                  {day?.trips?.map(trip => (
                    <TouchableOpacity
                      key={trip.id}
                      style={styles.tripRow}
                      onPress={() => navigation.navigate("DayDetail", trip)}
                    >
                      <View style={styles.tripLine}>
                        <View style={styles.blueDot} />
                        <Text style={styles.tripText}>
                          {trip.originCity}, {trip.originState}
                        </Text>
                      </View>

                      <View style={styles.tripLine}>
                        <View style={styles.greenDot} />
                        <Text style={styles.tripText}>
                          {trip.destinationCity}, {trip.destinationState}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* 🟠 ACTIVITY */}
                  {day.activity && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#FFF3E0",
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 6,
                      }}
                      onPress={() =>
                        // navigation.navigate("AddMissingDayScreen", {
                        //   date: day.date,
                        //   isEdit: true,
                        //   data: day.activity,
                        // })
                        navigation.navigate('DayEntryScreen', {
                          mode: "MISSING_DAY",
                          date: day.date,
                          isEdit: true,
                          data: day.activity,
                        })
                      }
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color="#FF9500"
                        />
                        <Text style={{ marginLeft: 6, fontWeight: "600" }}>
                          {getAutoTypeOfDayName(day.activity, day.date)}
                          {/* {day.activity.typeOfDay?.name} */}
                        </Text>
                      </View>

                      <Text style={{ marginLeft: 22, color: "#666" }}>
                        {day.activity.state}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}
          </View>
        )}

      </View>
    );
  };



  const regulatoryCalendar = getWeekCalendarData(weekWiseTimeline);
  const getTimelineData = (dataObj = {}) => {
    const formatDate = (date) =>
      // new Date(date).toLocaleDateString('en-IN', {
      parseLocalDate(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });

    return Object.values(dataObj)
      .map((dayArray) => {
        if (!dayArray.length) return null;

        const first = dayArray[0];
        const last = dayArray[dayArray.length - 1];

        // const start = new Date(first.startDate);
        // const end = new Date(last.endDate);
        const start = parseLocalDate(first.startDate);
        const end = parseLocalDate(last.endDate);

        const days =
          Math.max(
            1,
            Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
          );

        return {
          id: first.id,
          date: `${formatDate(start)} - ${formatDate(end)}`,
          days: `${days.toString().padStart(2, '0')} Days`,
          location: `${last.destinationCity}, ${last.destinationState}`,
          manual: first.isManual ?? false,
          color:
            // STATE_COLOR_MAP[last.destinationState] || colors.primary,
            colors.primary,
        };
      })
      .filter(Boolean);
  };

  const timelineData = getTimelineData(yearWiseTimeline);

  const residenciesData = {
    past: [
      { id: 1, date: '01 Jan - 07 Jan', location: 'New York, USA', days: '7 Days', color: '#28a0dd' },
      { id: 2, date: '08 Jan - 14 Jan', location: 'California, USA', days: '7 Days', color: '#34c759', manual: true },
      { id: 3, date: '15 Jan - 21 Jan', location: 'Texas, USA', days: '7 Days', color: '#5ac8fa' },
      { id: 4, date: '22 Jan - 28 Jan', location: 'Florida, USA', days: '7 Days', color: '#a5f1a9', manual: true },
      { id: 5, date: '29 Jan - 04 Feb', location: 'New York, USA', days: '7 Days', color: '#007aff' },
    ],
    upcoming: [
      { id: 6, date: '05 Feb - 11 Feb', location: 'California, USA', days: '7 Days', color: '#34c759' },
      { id: 7, date: '12 Feb - 18 Feb', location: 'Texas, USA', days: '7 Days', color: '#5ac8fa', manual: true },
      { id: 8, date: '19 Feb - 25 Feb', location: 'Florida, USA', days: '7 Days', color: '#a5f1a9' },
    ],
  };


  const renderRegulatoryEntry = (item, index) => (
    <TouchableOpacity style={styles.regulatoryRow} key={index}
      onPress={() => navigation.navigate('AddTrip', { id: item._id })}>

      <View style={{ backgroundColor: '#F1F1F1', borderRadius: 50, height: 50, width: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15, }}>
        <Text style={styles.regulatoryId}>{item.id}</Text>
        <Text style={styles.regulatoryId2}>{item.day}</Text>
      </View>

      <View style={styles.nameLocationContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dot1} />
          <Text style={styles.regulatoryName}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dot2} />
          <Text style={styles.regulatoryLocation}>{item.location}</Text>
        </View>

      </View>
    </TouchableOpacity>
  );


  const renderRegulatorySection = (section, index) => (
    <View key={index} style={styles.regulatorySection}>
      <View style={styles.rowContainer}>

        {/* Date Bubble */}
        <View style={styles.dateColumn}>
          <View style={styles.dateCircle}>
            <Text style={styles.dateText}>{section.formattedDate}</Text>
            <Text style={styles.dayText}>{section.day}</Text>
          </View>

          {/* Vertical timeline */}
          {/* <View style={styles.verticalLine} /> */}
        </View>

        {/* Locations */}
        <View style={{ flex: 1 }}>
          {/* {section.locations.map((item, idx) => {
            if (item.type === 'separator') {
              return <View key={idx} style={styles.tripSeparator} />;
            }

            const isDestination = item.type === 'destination';

            const Wrapper = isDestination ? TouchableOpacity : View;

            return (
              <Wrapper
                key={idx}
                activeOpacity={0.7}
                onPress={
                  isDestination
                    // ? () => navigation.navigate('AddTrip', { id: item.tripId })
                    ? () => navigation.navigate('DayDetail', item)
                    : undefined
                }
                style={styles.locationRow}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isDestination ? '#27AE60' : '#2F80ED' },
                  ]}
                />
                <Text style={styles.locationText}>
                  {item.city}, {item.state}
                </Text>
              </Wrapper>
            );
          })} */}
          {section.trips.map(trip => (
            <TouchableOpacity
              key={trip.id}
              style={styles.locationRow}
              onPress={() => navigation.navigate("DayDetail", trip)}
            >
              <View style={[styles.dot, { backgroundColor: "#2F80ED" }]} />
              <Text style={styles.locationText}>
                {trip.originCity} → {trip.destinationCity}
              </Text>
            </TouchableOpacity>
          ))}
          {section.missing && (
            <TouchableOpacity
              style={{
                backgroundColor: "#FFF3E0",
                padding: 10,
                borderRadius: 8,
                marginTop: 6,
              }}
              onPress={() =>
                navigation.navigate("DayEntryScreen", {
                  mode: "MISSING_DAY",
                  date: section.date,
                  isEdit: true,
                  data: section.missing,
                })
              }
            >
              <Text style={{ fontWeight: "600", color: "#FF9500" }}>
                {/* Missing Day: {section.missing.typeOfDay?.name} */}
                Missing Day: {getAutoTypeOfDayName(section.missing, section.date)}
              </Text>
              <Text style={{ color: "#666" }}>
                State: {section.missing.state}
              </Text>
            </TouchableOpacity>
          )}


        </View>
      </View>

      {index < regulatoryCalendar.length - 1 && (
        <View style={styles.sectionSeparator} />
      )}
    </View>
  );

  const getAutoTypeOfDayName = (activity, date) => {
    if (!activity) return "";

    const isDefault = activity?.typeOfDay?.id === 1;
    const isAuto = activity?.creationType === "automatic";

    if (!isDefault || !isAuto) {
      return activity?.typeOfDay?.name;
    }

    // const d = new Date(date);
    const d = parseLocalDate(date);
    const day = d.getDay();

    if (day === 0 || day === 6) {
      return "Weekend"; // id = 3
    }

    return "Working"; // id = 2
  };


  return (
    <LinearGradient
      colors={['#9ab1fa', '#ffffff']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header title={'Calendar'} />

        <View style={styles.content}>
          <View style={styles.tabs}>
            {['Week', 'Month', 'Year'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedTab === 'Month' && (
            <View style={{
              flex: 1,
              backgroundColor: '#fff',
              padding: 16,
              elevation: 1
            }}>
              <View style={styles.calendarWrapper} pointerEvents="auto">
                <Calendar
                  markingType={'multi-dot'}
                  // onMonthChange={(monthData) => {
                  //   console.log('Month Changed =>', monthData);

                  //   GET_MONTH_WISE_TIMELINE({
                  //     month: monthData.month,
                  //     year: monthData.year,
                  //   });
                  // }}
                  onMonthChange={(monthData) => {
                    setVisibleMonth({
                      month: monthData.month,
                      year: monthData.year,
                    });

                    GET_MONTH_WISE_TIMELINE({
                      month: monthData.month,
                      year: monthData.year,
                    });
                  }}

                  // markedDates={getMarkedDates(monthWiseTimeline)}
                  markedDates={markedDates}
                  onDayPress={handleDayPress}
                  dayComponent={({ date, state, marking }) => {
                    const weekend = isWeekend(date.dateString);

                    return (
                      <TouchableOpacity
                        onPress={() => handleDayPress({ dateString: date.dateString })}
                        disabled={state === 'disabled'}
                        style={{ alignItems: 'center', paddingVertical: 4 }}
                      >
                        {/* Day number */}
                        <Text
                          style={{
                            color:
                              state === 'disabled'
                                ? '#d9e1e8'
                                : weekend
                                  ? '#D32F2F' // 🔴 Sat–Sun
                                  : '#2d4150',
                            fontWeight: weekend ? '600' : '400',
                            fontSize: 16,
                          }}
                        >
                          {date.day}
                        </Text>

                        {/* Dots (IMPORTANT) */}
                        {marking?.dots && (
                          <View style={{ flexDirection: 'row', marginTop: 2 }}>
                            {marking.dots.map((dot, index) => (
                              <View
                                key={index}
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: dot.color,
                                  marginHorizontal: 1,
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}


                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#00adf5',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#00adf5',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    arrowColor: '#000',
                    monthTextColor: '#000',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 16,


                  }}
                />
              </View>

              <View style={styles.legendContainer}>
                {legendStates.map((state) => (
                  <View key={state} style={styles.legendItem}>
                    <View
                      style={[
                        styles.dot,
                        // { backgroundColor: STATE_COLOR_MAP[state] || '#999' }
                        { backgroundColor: '#999' }
                      ]}
                    />
                    <Text style={styles.legendText}>{state}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {selectedTab === 'Week' && (
            <View
              style={{
                position: 'relative',
                flex: 1,
                borderWidth: 0.5,
                borderColor: '#E0E0E0',
                padding: 10,
                borderRadius: 10,
              }}
            >
              {regulatoryCalendar.length === 0 ? (


                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No trip found in this week
                  </Text>
                </View>

              ) : (

                <CustomScroll>
                  {regulatoryCalendar.map(renderRegulatorySection)}
                </CustomScroll>

              )}

              {/* <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  right: 20,
                  borderRadius: 30,
                  elevation: 5,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => navigation.navigate('WeeklyReportScreen')}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  View Weekly Detail
                </Text>
              </TouchableOpacity> */}
            </View>
          )}

          {selectedTab === 'Year' && (


            // <View style={{ flex: 1 }}>
            //   <View style={{
            //     flexDirection: 'row',
            //     // backgroundColor: '#F1F1F1',
            //     borderRadius: 12,
            //     marginBottom: 15,
            //     overflow: 'hidden',
            //   }}>
            //     {['past', 'upcoming'].map((type) => (
            //       <TouchableOpacity
            //         key={type}
            //         onPress={() => setSelectedResidencyType(type)}
            //         style={[
            //           styles.residencyTab,
            //         ]}
            //       >
            //         <Text
            //           style={[
            //             styles.residencyTabText,
            //             selectedResidencyType === type && styles.residencyTabTextActive,
            //           ]}
            //         >
            //           {type === 'past' ? 'Past Residencies' : 'Upcoming Residencies'}
            //         </Text>
            //       </TouchableOpacity>
            //     ))}
            //   </View>

            //   <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            //     {timelineData?.map((item) => (
            //     // {residenciesData[selectedResidencyType].map((item) => (
            //       <View key={item.id} style={styles.card}>
            //         <View style={[styles.colorStrip, { backgroundColor: item.color }]} />
            //         <View style={styles.infoContainer}>
            //           <View style={styles.topRow}>
            //             <Text style={styles.dateText}>{item.date}</Text>
            //             <Text style={styles.daysText}>{item.days}</Text>
            //           </View>
            //           <View style={styles.bottomRow}>
            //             <Text style={styles.locationText}>{item.location}</Text>
            //             <View style={styles.rightIcons}>
            //               {item.manual && (
            //                 <View style={styles.manualTag}>
            //                   <Text style={styles.manualText}>Manual</Text>
            //                 </View>
            //               )}
            //               <Ionicons
            //                 name="chatbubble-outline"
            //                 size={16}
            //                 color="#999"
            //                 style={{ marginLeft: 8 }}
            //               />
            //             </View>
            //           </View>
            //         </View>
            //       </View>
            //     ))}
            //   </ScrollView>



            //   {/* <ScrollView showsVerticalScrollIndicator={false}>
            //     {timelineData.map((item) => (
            //       <View key={item.id} style={styles.card}>
            //         <View
            //           style={[styles.colorStrip, { backgroundColor: item.color }]}
            //         />

            //         <View style={styles.infoContainer}>
            //           <View style={styles.topRow}>
            //             <Text style={styles.dateText}>{item.date}</Text>
            //             <Text style={styles.daysText}>{item.days}</Text>
            //           </View>
            //           <View style={styles.bottomRow}>
            //             <Text style={styles.locationText}>{item.location}</Text>

            //             <View style={styles.rightIcons}>
            //               {item.manual && (
            //                 <View style={styles.manualTag}>
            //                   <Text style={styles.manualText}>Manual</Text>
            //                 </View>
            //               )}

            //               <Ionicons
            //                 name="chatbubble-outline"
            //                 size={16}
            //                 color="#999"
            //                 style={{ marginLeft: 8 }}
            //               />
            //             </View>
            //           </View>
            //         </View>
            //       </View>
            //     ))}
            //   </ScrollView> */}


            // </View>
            <>
              <View style={styles.yearHeader}>
                <TouchableOpacity
                  style={styles.yearDropdownBtn}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.yearText}>
                    {selectedYear}
                  </Text>
                  <Ionicons
                    name={showYearDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#000"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                {/* Dropdown */}
                {showYearDropdown && (
                  <View style={styles.yearDropdown}>
                    {yearOptions.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearOption,
                          year === selectedYear && styles.yearOptionActive,
                        ]}
                        onPress={() => onYearSelect(year)}
                      >
                        <Text
                          style={[
                            styles.yearOptionText,
                            year === selectedYear && styles.yearOptionTextActive,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* {weeklyData.map(renderWeekCard)} */}
                {weeklyData.map((item, index) => (
                  <YearWeekCard
                    key={index}
                    item={item}
                    index={index}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
        {selectedTab == 'Year' && <TouchableOpacity
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>}

        <Modal
          visible={tripModalVisible}
          transparent
          animationType="none"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY }] },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Drag Handle */}
              <View style={styles.dragHandle} />
              <View style={[styles.tripRow, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={styles.modalTitle}>Trips</Text>
                <Text style={styles.modalTitle} onPress={closeModal}>Close</Text>
              </View>
              <FlatList
                data={selectedTrips}
                keyExtractor={(item) => item.id.toString()}
                ItemSeparatorComponent={() => <View style={styles.tripDivider} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tripRow}
                    onPress={() => {
                      closeModal();
                      // navigation.navigate('AddTrip', { id: item.id });
                      // navigation.navigate('DayDetail', item)
                      navigation.navigate("DayEntryScreen", {
                        mode: "TRIP", // or "TRIP"
                        date: selectedDate,
                        isEdit: true,
                        data: item
                      });
                    }}
                  >
                    {/* Origin */}
                    <View style={styles.tripLine}>
                      <View
                        style={[
                          styles.tripDot,
                          {
                            backgroundColor:
                              STATE_COLOR_MAP[item.originState] || '#999',
                          },
                        ]}
                      />
                      <Text style={styles.tripText}>
                        {item.originCity}, {item.originState}
                      </Text>
                    </View>

                    {/* Destination */}
                    <View style={styles.tripLine}>
                      <View
                        style={[
                          styles.tripDot,
                          {
                            backgroundColor:
                              STATE_COLOR_MAP[item.destinationState] || '#999',
                          },
                        ]}
                      />
                      <Text style={styles.tripText}>
                        {item.destinationCity}, {item.destinationState}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </View>
        </Modal>

        <Modal
          visible={dayActionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDayActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.actionModal}>

              <Text style={styles.modalTitle}>
                {selectedDate}
              </Text>

              {/* ✅ Trips option (sirf jab trips ho) */}
              {selectedTrips.length > 0 && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setDayActionModalVisible(false);

                    if (selectedTrips.length === 1) {
                      // navigation.navigate('DayDetail', selectedTrips[0]);
                      navigation.navigate("DayEntryScreen", {
                        mode: "TRIP", // or "TRIP"
                        date: selectedDate,
                        isEdit: true,
                        data: selectedTrips[0]
                      });

                    } else {
                      setTripModalVisible(true);
                    }
                  }}
                >
                  <Text style={styles.actionText}>
                    View Trips ({selectedTrips.length})
                  </Text>
                </TouchableOpacity>
              )}

              {/* ✅ Manual option (ALWAYS for past/today) */}
              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: isMissingAlreadyAdded && selectedMissingDate.isUpdated ? '#007AFF' :
                    isMissingAlreadyAdded && !selectedMissingDate.isUpdated ? '#FFCC00' : '#FF3B30'
                }]}
                onPress={() => {
                  setDayActionModalVisible(false);
                  // navigation.navigate('AddMissingDayScreen', {
                  //   date: selectedDate,
                  // });
                  // if (isMissingAlreadyAdded) {
                  //   navigation.navigate('AddMissingDayScreen', {
                  //     date: selectedDate,
                  //     isEdit: true,
                  //     data: missingDataForDay,
                  //   });
                  // } else {
                  //   navigation.navigate('AddMissingDayScreen', {
                  //     isEdit: false,
                  //     date: selectedDate,
                  //   });
                  // }
                  if (isMissingAlreadyAdded) {
                    navigation.navigate('DayEntryScreen', {
                      mode: "MISSING_DAY",
                      date: selectedDate,
                      isEdit: true,
                      // data: missingDataForDay,
                      data: selectedMissingDate || null,
                    });
                  } else {
                    navigation.navigate('DayEntryScreen', {
                      isEdit: false,
                      date: selectedDate,
                      mode: "MISSING_DAY",
                    });
                  }
                  // navigation.navigate("DayEntryScreen", {
                  //   // mode: "MISSING_DAY", // or "TRIP"
                  //   mode: "TRIP", // or "TRIP"
                  //   date: selectedDate,
                  //   isEdit: true,
                  //   data: missingDataForDay
                  // });
                }}
              >
                <Text style={[styles.actionText, { color: '#fff' }]}>
                  {/* {isMissingAlreadyAdded ? 'Fill Missing Day' : 'Add Missing Day'} */}
                  {isMissingAlreadyAdded && selectedMissingDate.isUpdated ? 'Edit Missing Day Info' :
                    isMissingAlreadyAdded && !selectedMissingDate.isUpdated ? 'Fix Missing Day Info' : 'Add Missing Day Info'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDayActionModalVisible(false)}
                style={{ marginTop: 15 }}
              >
                <Text style={{ color: '#007AFF' }}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>



      </SafeAreaView>
    </LinearGradient>
  );
}



function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    loginToken: state.auth.loginToken,
    yearWiseTimeline: state.common.yearWiseTimeline,
    weekWiseTimeline: state.common.weekWiseTimeline,
    monthWiseTimeline: state.common.monthWiseTimeline,
    missingActivityList: state.common.missingActivityList,
  };
}


const mapDispatchToProps = {
  GET_WEEK_WISE_TIMELINE,
  GET_MONTH_WISE_TIMELINE,
  GET_YEAR_WISE_TIMELINE,
  GET_MISSING_ACTIVITY_LIST,
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarScreen);



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    borderRadius: 15,
    // padding: 5,
    marginBottom: 15,
    // paddingVertical:10
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 15
  },
  activeTab: {
    backgroundColor: colors.primary
  },
  tabText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff'
  },
  calendarWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    // backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',  // allows items to go to next line
    width: '100%',
    justifyContent: 'flex-start',
    columnGap: 15,     // adds horizontal spacing between items
    rowGap: 10,        // adds vertical spacing between rows
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    fontSize: 15,
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 15,
    marginTop: 25,
  },
  regulatorySection: {
    margin: 5,
    backgroundColor: '#fff',
    elevation: 1,
    padding: 10

  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 15,
    // backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  regulatoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regulatoryId: {
    width: 50,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center'
    // marginRight: 15,
  },
  regulatoryId2: {
    width: 50,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'grey',
    textAlign: 'center',
    // marginRight: 15,
    textTransform: 'capitalize'
  },
  nameLocationContainer: {
    // flex: 1,
  },
  regulatoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
    alignItems: 'center'
  },
  regulatoryLocation: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  separator: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  // Residency Card Styles - EXACT match to screenshot
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  dateRange: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  rightSection: {
    marginLeft: 10,
  },
  manualTag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  manualText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: colors.primary,
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
    marginRight: 10
  },
  dot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00d250',
    marginHorizontal: 3,
    marginRight: 10
  },
  // ✅ Residency Card Styles - Pixel-perfect match
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    // paddingVertical: 14,
    paddingRight: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  colorStrip: {
    width: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    alignSelf: 'stretch',
    marginRight: 12,
    height: '100%'
  },

  infoContainer: {
    flex: 1, padding: 10
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },

  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34c759',
  },

  locationText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  manualTag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#34c759',
  },

  manualText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  residencyTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  residencyTabActive: {
    backgroundColor: colors.primary,
  },

  residencyTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#B4B4B4',
  },

  residencyTabTextActive: {
    color: '#000',
    fontWeight: '600',
  },








  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  colorStrip: {
    width: 8,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  daysText: {
    fontSize: 14,
    color: '#999',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualTag: {
    backgroundColor: '#DFF5E3',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  manualText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },






  rowContainer: {
    flexDirection: 'row',
  },

  dateColumn: {
    alignItems: 'center',
    marginRight: 15,
  },

  dateCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },

  dayText: {
    fontSize: 12,
    color: '#666',
  },

  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 6,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },

  locationText: {
    fontSize: 14,
    color: '#333',
  },

  tripSeparator: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 8,
  },

  sectionSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },






  cardWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginBottom: 12,
    overflow: 'hidden',
  },

  rowContainer: {
    flexDirection: 'row',
  },

  colorStrip: {
    width: 8,
  },

  cardBody: {
    flex: 1,
    padding: 14,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },

  daysText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  bottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  locationText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  manualTag: {
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
  },

  manualText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },

  /* EXPANDED */
  expandedContainer: {
    paddingHorizontal: 22, // color strip + spacing
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },

  tripRow: {
    marginTop: 10,
  },

  tripLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2F80ED',
    marginRight: 8,
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27AE60',
    marginRight: 8,
  },

  tripText: {
    fontSize: 14,
    color: '#333',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    elevation: 10,        // 👈 ANDROID FIX
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },

  tripRow: {
    paddingVertical: 12,
  },

  tripCity: {
    fontSize: 15,
    fontWeight: '500',
  },

  tripState: {
    fontSize: 13,
    color: '#666',
  },

  tripDivider: {
    height: 1,
    backgroundColor: '#eee',
  },

  closeBtn: {
    alignItems: 'center',
    marginTop: 12,
  },

  closeText: {
    color: '#007AFF',
    fontSize: 16,
  },

  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 12,
  },

  tripRow: {
    paddingVertical: 12,
  },

  tripLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  tripDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  tripText: {
    fontSize: 14,
    color: '#333',
  },

  missingModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    margin: 20,
    alignItems: 'center',
  },

  addMissingBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  actionModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },

  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    marginTop: 12,
    alignItems: 'center',
  },

  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  yearHeader: {
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 10,
  },

  yearDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
  },

  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  yearDropdown: {
    position: 'absolute',
    top: 45,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    width: 120,
  },

  yearOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },

  yearOptionActive: {
    backgroundColor: '#EAF1FF',
  },

  yearOptionText: {
    fontSize: 15,
    color: '#333',
  },

  yearOptionTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },



});