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
import colors from '../../theme/colors';

const SecondHomeForm = ({ data, onChange }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [openDissolutionPicker, setOpenDissolutionPicker] = useState(false);

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

            <Text style={styles.label}>Do you own this property? *</Text>
            <View style={styles.yesNoContainer}>
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.owns === true && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('owns', true)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.owns === true && styles.yesNoTextActive
                    ]}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.owns === false && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('owns', false)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.owns === false && styles.yesNoTextActive
                    ]}>No</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Property Exemptions? *</Text>
            <View style={styles.yesNoContainer}>
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.exemptions === true && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('exemptions', true)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.exemptions === true && styles.yesNoTextActive
                    ]}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.exemptions === false && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('exemptions', false)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.exemptions === false && styles.yesNoTextActive
                    ]}>No</Text>
                </TouchableOpacity>
            </View>

            {data.exemptions === false && (
                <>
                    <Text style={styles.label}>Dissolution Date (Optional)</Text>
                    <TouchableOpacity 
                        style={styles.inputContainer}
                        onPress={() => setOpenDissolutionPicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                        <Text style={[styles.input, !data.dissolutionDate && styles.placeholder]}>
                            {data.dissolutionDate || "Select Date"}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.dateEstablished ? new Date(data.dateEstablished) : new Date()}
                onConfirm={(date) => {
                    updateField('dateEstablished', date.toLocaleDateString("en-CA").slice(0, 10));
                    setOpenDatePicker(false);
                }}
                onCancel={() => setOpenDatePicker(false)}
            />

            <DatePicker
                modal
                mode="date"
                open={openDissolutionPicker}
                date={data.dissolutionDate ? new Date(data.dissolutionDate) : new Date()}
                onConfirm={(date) => {
                    updateField('dissolutionDate', date.toLocaleDateString("en-CA").slice(0, 10));
                    setOpenDissolutionPicker(false);
                }}
                onCancel={() => setOpenDissolutionPicker(false)}
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
    yesNoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    yesNoButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yesNoButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yesNoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    yesNoTextActive: {
        color: '#fff',
    },
});

export default SecondHomeForm;