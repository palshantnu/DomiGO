import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import GoogleAutoComplete from '../../components/GoogleAutoComplete';
import { GOOGLE_KEY } from '../../helpers/CommonHelpers';

const AddressOfRecordForm = ({ data, onChange }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value, enabled: true });
    };

    return (
        <View>
            <Text style={styles.label}>Date Established *</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.dateEstablished && styles.placeholder]}>
                    {data.dateEstablished || "Select Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Address *</Text>
            <GoogleAutoComplete
                placeholder="Search Address"
                apiKey={GOOGLE_KEY}
                isResidence={true}
                value={data.address}
                onSelect={(value) => updateField('address', value)}
            />

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.dateEstablished ? new Date(data.dateEstablished) : new Date()}
                onConfirm={(date) => {
                    updateField('dateEstablished', date.toISOString().slice(0, 10));
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
});

export default AddressOfRecordForm;