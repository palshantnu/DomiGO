import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import colors from '../../theme/colors';

const TaxFilingForm = ({ data, onChange, userData }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value, enabled: true });
    };

    const years = ["1", "2", "3", "4", "5", "6+"];

    return (
        <View>
            <Text style={styles.label}>Last File Date *</Text>
            <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.lastFileDate && styles.placeholder]}>
                    {data.lastFileDate || "Select Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Tax filling to state registered with IRS *</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter state"
                    placeholderTextColor="#A8A8A8"
                    value={!data?.state ? userData?.state : data?.state || ''}
                    onChangeText={(val) => updateField('state', val)}
                />
            </View>

            <Text style={styles.label}>Years Filed Within the state *</Text>
            <View style={styles.yearsContainer}>
                {years.map((year) => (
                    <TouchableOpacity
                        key={year}
                        style={[
                            styles.yearChip,
                            data.yearsFiled === year && styles.yearChipSelected
                        ]}
                        onPress={() => updateField('yearsFiled', year)}
                    >
                        <Text style={[
                            styles.yearChipText,
                            data.yearsFiled === year && styles.yearChipTextSelected
                        ]}>
                            {year} {year !== "6+" ? "year" : "years"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.lastFileDate ? new Date(data.lastFileDate) : new Date()}
                onConfirm={(date) => {
                    updateField('lastFileDate', date.toLocaleDateString("en-CA").slice(0, 10));
                    setOpenDatePicker(false);
                }}
                onCancel={() => setOpenDatePicker(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
        color: "#333",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000",
        marginLeft: 12,
    },
    placeholder: {
        color: "#A8A8A8",
    },
    yearsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    yearChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yearChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    yearChipTextSelected: {
        color: '#fff',
    },
});

export default TaxFilingForm;