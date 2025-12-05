import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import Header from '../components/Header';
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { connect, useDispatch } from "react-redux";
import { DELETE_RESIDENCY_RECORD, GET_Document_Category_LIST, GET_RESIDENCY_RECORD_LIST } from "../redux/actions/action-creator";
import { useNavigation } from "@react-navigation/native";
import colors from "../theme/colors";
import { CustomToast } from "../helpers/CommonHelpers";

function ResidencyHistoryScreen({ documentCategoryList, GET_RESIDENCY_RECORD_LIST, ResidencydocumentList }) {
    console.log('ResidencydocumentList', ResidencydocumentList);
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const groupedByYear = ResidencydocumentList.reduce((acc, item) => {
        const year = new Date(item.issueDate).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
    }, {});

    const renderCard = (item) => (
        <TouchableOpacity onPress={() =>
            navigation.navigate("ResidencyRecordDetails", { id: item.id })
        } key={item.id} style={styles.card}>


            <View style={styles.iconBox}>
                <MaterialCommunityIcons
                    name={item.category?.name === "domicile" ? "home-outline" : "file-document-outline"}
                    size={26}
                    color="#595959"
                />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>
                    Issued: {new Date(item.issueDate).toDateString()}
                </Text>
            </View>

            <View style={styles.actionBtns}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                    <Feather name="edit" size={20} color="#3C95FF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const API_Function = useCallback(
        (startup = false) =>
            new Promise((resolve, reject) => {
                dispatch(GET_Document_Category_LIST()).then(resolve).catch(reject);
                GET_RESIDENCY_RECORD_LIST().then(resolve).catch(reject);
            }),
        [
            GET_Document_Category_LIST,
            GET_RESIDENCY_RECORD_LIST,
        ],
    );
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            API_Function();

        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        API_Function();
    }, [])
    const handleDelete = (id) => {
        Alert.alert(
            "Delete Record",
            "Are you sure you want to delete this record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await dispatch(DELETE_RESIDENCY_RECORD(id));
                            CustomToast.show("Record deleted successfully");
                            await API_Function();
                        } catch (error) {
                            CustomToast.show("Failed to delete record");
                        }
                    },
                },
            ]
        );
    };
    const handleEdit = (item) => {
        navigation.navigate("CreateResidencyRecord", {
            editData: {
                ...item,
                categoryId: item.categoryId ?? item.category?.id,
                attachment: item.attachment_url ?? null
            }
        });
    };



    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={'Residency Records'} />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => navigation.navigate("CreateResidencyRecord")} style={styles.addTripButton}>
                        <Ionicons style={{ backgroundColor: colors.primary, borderRadius: 40 }} name="add" size={20} color={colors.white} />
                        <Text style={styles.addTripText}>Add Record</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate("CreateResidencyRecord")}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#000" />
                        <Text style={{ color: '#000', fontSize: 13 }}>{' '}Add Record</Text>
                    </TouchableOpacity> */}
                    {Object.keys(groupedByYear).map((year) => (
                        <View key={year}>
                            <View style={styles.yearRow}>
                                <Ionicons name="calendar-outline" size={20} color="#000" />
                                <Text style={styles.yearText}>{year}</Text>
                            </View>

                            {groupedByYear[year].map((item) => renderCard(item))}
                        </View>
                    ))}
                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

function mapStateToProps(state) {
    return {
        loginToken: state.auth.loginToken,
        userData: state.auth.userData,
        documentCategoryList: state.common.documentCategoryList,
        ResidencydocumentList: state.common.ResidencydocumentList,
    };
}

const mapDispatchToProps = {
    GET_Document_Category_LIST,
    GET_RESIDENCY_RECORD_LIST,
    DELETE_RESIDENCY_RECORD
};

export default connect(mapStateToProps, mapDispatchToProps)(ResidencyHistoryScreen);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: "#F2F2F7",
        // paddingTop: 10,
    },
    yearRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        paddingHorizontal: 20,
    },
    yearText: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 10,
        color: "#000",
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginVertical: 8,
        padding: 15,
        borderRadius: 16,
        alignItems: "center",
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E9E9E9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: "#000",
    },
    cardDate: {
        fontSize: 12,
        // fontWeight: "500",
        color: "#000",
        marginTop: 3,
    },
    actionBtns: {
        // flexDirection: "row",
        alignItems: "center",
        // gap: 10,
    },
    editBtn: { padding: 3 },
    deleteBtn: { padding: 3 },
    addTripButton: {
        flexDirection: "row",
        alignItems: "center",
        // borderWidth: 1,
        // borderColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: "#F1F1F1",
        padding: 5,
        // width: 100,
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        marginRight: 20
    },
    addTripText: {
        color: '#000',
        fontSize: 15,
        fontWeight: "500",
        marginLeft: 4,
    },

});
