import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import CustomScroll from '../components/CustomScroll';
import { GET_MONTH_WISE_TIMELINE, GET_WEEK_WISE_TIMELINE, GET_YEAR_WISE_TIMELINE } from '../redux/actions/action-creator';
import { connect } from 'react-redux';

function CalendarScreen({ navigation, GET_MONTH_WISE_TIMELINE, GET_WEEK_WISE_TIMELINE, GET_YEAR_WISE_TIMELINE, yearWiseTimeline, weekWiseTimeline, monthWiseTimeline }) {
  const [selectedTab, setSelectedTab] = useState('Month');
  const [selectedResidencyType, setSelectedResidencyType] = useState('past');

  console.log('yearWiseTimeline', yearWiseTimeline);
  console.log('weekWiseTimeline', weekWiseTimeline);
  console.log('monthWiseTimeline', monthWiseTimeline);

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

  const formatDate = (date) =>
    date.toISOString().split('T')[0]; // YYYY-MM-DD

  return {
    start: formatDate(startOfWeek),
    end: formatDate(endOfWeek),
  };
};



  useEffect(() => {
    const today = new Date();
      const { start, end } = getCurrentWeekDates();

    GET_WEEK_WISE_TIMELINE({ start, end });;
    GET_YEAR_WISE_TIMELINE({year:today.getFullYear()});
    GET_MONTH_WISE_TIMELINE({
      month: today.getMonth() + 1, // JS months 0-based
      year: today.getFullYear(),
    });
  }, []);


  const STATE_COLOR_MAP = {
    "Madhya Pradesh": "#28a0dd",
    "Uttar Pradesh": "#34c759",
    "Delhi": "#5ac8fa",
    "California": "#a5f1a9",
    "Arizona": "#1d3b73",
  };


  const getMarkedDates = (monthWiseTimeline) => {
    const result = monthWiseTimeline || {};
    const marked = {};

    Object.keys(result).forEach(date => {
      const uniqueStates = [
        ...new Set(result[date].map(item => item.state))
      ];

      marked[date] = {
        dots: uniqueStates.map(state => ({
          color: STATE_COLOR_MAP[state] || '#999'
        }))
      };
    });

    return marked;
  };



  const getLegendStates = (monthWiseTimeline) => {
    const result = monthWiseTimeline || {};
    const stateSet = new Set();

    Object.values(result).forEach(dayArray => {
      dayArray.forEach(item => {
        if (item.state) {
          stateSet.add(item.state);
        }
      });
    });

    return Array.from(stateSet);
  };

  const legendStates = getLegendStates(monthWiseTimeline);



  const getWeekCalendarData = (weekResult = {}) => {
    return Object.keys(weekResult).map(date => {
      const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      return {
        period: formattedDate,
        entries: weekResult[date].map((item, index) => ({
          id: item.state?.slice(0, 3).toUpperCase(),
          name: item.city,
          location: item.state,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        }))
      };
    });
  };

  const regulatoryCalendar = getWeekCalendarData(weekWiseTimeline);

  const getYearData = (data = []) => {
    const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    return data.map((item, index) => ({
      id: index + 1,
      // date: `${new Date(item.startDate).toLocaleDateString('en-IN')} - 
      //      ${new Date(item.endDate).toLocaleDateString('en-IN')}`,
      date: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
      location: `${item.city}, ${item.state}`,
      days: `${item.days} Day${item.days > 1 ? 's' : ''}`,
      color: STATE_COLOR_MAP[item.state] || colors.primary,
      // color: colors.primary,
      manual: item.isManual
    }));
  };

  const today = new Date();

  const yearData = getYearData(yearWiseTimeline || []);

  const residenciesDataa = yearData.filter(item => {
    const end = new Date(item.date.split('-')[1]);
    return selectedResidencyType === 'past'
      ? end < today
      : end >= today;
  });




  // const regulatoryCalendar = [
  //   {
  //     period: 'August 12 - August 18, 2024',
  //     entries: [
  //       { id: 'AUD', name: 'Lay Ayes', location: 'California', day: "mon" },
  //       { id: 'NOT', name: 'Picker', location: 'Kissen', day: "tou" },
  //       { id: 'AUD', name: 'Sun Fushido', location: 'Call for Is', day: "mon" },
  //       { id: 'NOT', name: 'Lay Vogue', location: 'Hoyoda', day: "mon" },
  //       { id: 'NOT', name: 'Set Lake', location: 'City, Utah', day: "mon" },
  //       { id: 'AUD', name: 'Mars', location: 'Nevada', day: "mon" },
  //       { id: 'AUD', name: 'Portland', location: 'Oregon', day: "mon" },
  //       { id: 'AUD', name: 'Screp', location: 'Wash Lake', day: "mon" },
  //       { id: 'AUD', name: 'Buffalo', location: 'Oregon', day: "mon" },
  //       { id: 'AUD', name: 'Southern', location: 'Wash Lake', day: "mon" },
  //     ]
  //   },
  //   {
  //     period: 'August 19 - August 25, 2024',
  //     entries: [
  //       { id: 'AUD', name: 'Santa', location: 'Texas', day: "mon" },
  //       { id: 'AUD', name: 'Elgin', location: 'Texas', day: "mon" },
  //       { id: 'AUD', name: 'Hudson', location: 'Texas', day: "mon" },
  //       { id: 'AUD', name: 'North Pacific', location: '', day: "mon" },
  //       { id: 'AUD', name: 'Canada', location: 'Florida', day: "mon" },
  //       { id: 'AUD', name: 'Tampa', location: 'Florida', day: "mon" },
  //       { id: 'AUD', name: 'Austin', location: 'Georgia', day: "mon" },
  //       { id: 'AUD', name: 'Chattleton', location: 'South Carolina', day: "mon" },
  //       { id: 'AUD', name: 'Chicago', location: 'North Carolina', day: "mon" },
  //       { id: 'AUD', name: 'Ralph', location: 'North Carolina', day: "mon" },
  //     ]
  //   }
  // ];
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
    <View style={styles.regulatoryRow} key={index}>
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
    </View>
  );

  const renderRegulatorySection = (section, index) => (
    <View key={index} style={styles.regulatorySection}>
      <Text style={styles.periodTitle}>{section.period}</Text>
      {section.entries.map(renderRegulatoryEntry)}
      {index < regulatoryCalendar.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <LinearGradient
      colors={['#9ab1fa', '#ffffff']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header title={'Residency Calendar'} />

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
              <View style={styles.calendarWrapper}>
                <Calendar
                  markingType={'multi-dot'}
                  // markedDates={{
                  //   '2025-11-01': {
                  //     dots: [{ color: '#28a0dd' }],
                  //   },
                  //   '2025-11-08': {
                  //     dots: [{ color: '#34c759' }],
                  //   },
                  //   '2025-11-15': {
                  //     dots: [{ color: '#5ac8fa' }],
                  //   },
                  //   '2025-11-22': {
                  //     dots: [
                  //       { color: '#34c759' },
                  //       { color: '#a5f1a9' },
                  //     ],
                  //   },
                  //   '2025-11-29': {
                  //     dots: [
                  //       { color: '#007aff' },
                  //       { color: '#1d3b73' },
                  //     ],
                  //   },
                  // }}
                  onMonthChange={(monthData) => {
                    console.log('Month Changed =>', monthData);

                    GET_MONTH_WISE_TIMELINE({
                      month: monthData.month,
                      year: monthData.year,
                    });
                  }}
                  markedDates={getMarkedDates(monthWiseTimeline)}
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
                        { backgroundColor: STATE_COLOR_MAP[state] || '#999' }
                      ]}
                    />
                    <Text style={styles.legendText}>{state}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {selectedTab == 'Week' && <View style={{ position: 'relative', height: '90%', borderWidth: 0.5, borderColor: '#E0E0E0', padding: 10, borderRadius: 10 }}>
            {selectedTab == 'Week' && <CustomScroll>


              {regulatoryCalendar.map(renderRegulatorySection)}

            </CustomScroll>}
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                borderRadius: 30,
                overflow: 'hidden',
                elevation: 5,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
              onPress={() => navigation.navigate('WeeklyReportScreen')} // your target screen
              activeOpacity={0.9}
            >
              <View

                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  borderRadius: 30,

                  backgroundColor: colors.primary
                }}
              >

                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                }}>View Weekly Detail</Text>
              </View>
            </TouchableOpacity>
          </View>}
          {selectedTab === 'Year' &&
            <View style={{ flex: 1 }}>
              <View style={{
                flexDirection: 'row',
                // backgroundColor: '#F1F1F1',
                borderRadius: 12,
                marginBottom: 15,
                overflow: 'hidden',
              }}>
                {['past', 'upcoming'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedResidencyType(type)}
                    style={[
                      styles.residencyTab,
                    ]}
                  >
                    <Text
                      style={[
                        styles.residencyTabText,
                        selectedResidencyType === type && styles.residencyTabTextActive,
                      ]}
                    >
                      {type === 'past' ? 'Past Residencies' : 'Upcoming Residencies'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* {residenciesData[selectedResidencyType].map((item) => ( */}
                {yearData?.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={[styles.colorStrip, { backgroundColor: item.color }]} />
                    <View style={styles.infoContainer}>
                      <View style={styles.topRow}>
                        <Text style={styles.dateText}>{item.date}</Text>
                        <Text style={styles.daysText}>{item.days}</Text>
                      </View>
                      <View style={styles.bottomRow}>
                        <Text style={styles.locationText}>{item.location}</Text>
                        <View style={styles.rightIcons}>
                          {item.manual && (
                            <View style={styles.manualTag}>
                              <Text style={styles.manualText}>Manual</Text>
                            </View>
                          )}
                          <Ionicons
                            name="chatbubble-outline"
                            size={16}
                            color="#999"
                            style={{ marginLeft: 8 }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          }
        </View>
        {selectedTab == 'Year' && <TouchableOpacity
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>}
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
  };
}


const mapDispatchToProps = {
  GET_WEEK_WISE_TIMELINE,
  GET_MONTH_WISE_TIMELINE,
  GET_YEAR_WISE_TIMELINE
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
});