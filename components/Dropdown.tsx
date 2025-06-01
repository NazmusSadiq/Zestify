import { fetchFilteredMovies } from '@/services/tmdb_API';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import FilteredViewer from './FilteredViewer';

interface DropdownProps {
    activeTab: string;
    onFilterSelect?: (filterType: string, filterValue: string) => void;
}

const screenWidth = Dimensions.get('window').width;

const filterOptions: Record<string, string[]> = {
    Movie: ['Genre', 'Release Year', 'Rating Above'],
    'TV Series': ['Genre', 'Network', 'Year'],
    Music: ['Genre', 'Artist', 'Year'],
    Game: ['Genre', 'Platform', 'Publisher'],
    Book: ['Genre', 'Author', 'Year'],
};

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi'];

export default function Dropdown({ activeTab, onFilterSelect }: DropdownProps) {
    const [visible, setVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-screenWidth));
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [releaseYear, setReleaseYear] = useState('');
    const [rating, setRating] = useState('');
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
    const [filteredData, setFilteredData] = useState<any[] | null>(null);
    const [showFilteredViewer, setShowFilteredViewer] = useState(false);
    const [caseType, setCaseType] = useState<string>(''); // 🆕 dynamic caseType

    const openDrawer = () => {
        setVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
        }).start();
    };

    const closeDrawer = () => {
        Animated.timing(slideAnim, {
            toValue: -screenWidth,
            duration: 250,
            useNativeDriver: false,
        }).start(() => setVisible(false));
    };

    const toggleFilter = (option: string) => {
        setExpandedFilter(prev => (prev === option ? null : option));
    };

    const handleFetchFilteredMovies = (filterType: string, filterValue: string) => {
        const internalCaseType = filterType.toLowerCase().replace(/\s/g, '_'); // 🆕 e.g. "Release Year" => "release_year"
        setCaseType(internalCaseType); // 🆕 set dynamically
        fetchFilteredMovies(filterType, filterValue)
            .then(results => {
                setFilteredData(results);
                setShowFilteredViewer(true);
                closeDrawer();
            })
            .catch(error => {
                console.error("Error in fetching filtered movies:", error);
            });
    };

    const renderFilterControl = (option: string) => {
        if (activeTab === 'Movie' && expandedFilter === option) {
            switch (option) {
                case 'Genre':
                    return (
                        <View style={styles.genreContainer}>
                            {genres.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genreButton,
                                        selectedGenre === g && styles.genreButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedGenre(g);
                                        handleFetchFilteredMovies('Genre', g);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.genreText,
                                            selectedGenre === g && styles.genreTextSelected,
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    );
                case 'Release Year':
                    return (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter year"
                                placeholderTextColor="#aaa"
                                keyboardType="numeric"
                                value={releaseYear}
                                onChangeText={setReleaseYear}
                            />
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    if (releaseYear) {
                                        handleFetchFilteredMovies('Release Year', releaseYear);
                                    }
                                }}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    );
                case 'Rating Above':
                    return (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter rating (1-10)"
                                placeholderTextColor="#aaa"
                                keyboardType="numeric"
                                value={rating}
                                onChangeText={setRating}
                            />
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    if (rating) {
                                        handleFetchFilteredMovies('Rating Above', rating);
                                    }
                                }}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    );
                default:
                    return null;
            }
        }
        return null;
    };

    const options = filterOptions[activeTab] || [];

    return (
        <View>
            <TouchableOpacity style={styles.filterButton} onPress={openDrawer}>
                <Text style={styles.filterButtonText}>☰ Filter</Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="none">
                <TouchableWithoutFeedback onPress={closeDrawer}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <Animated.View style={[styles.drawer, { left: slideAnim }]}>
                                <Text style={styles.drawerTitle}>{activeTab} Filters</Text>

                                {options.map((option) => (
                                    <View key={option} style={styles.filterItem}>
                                        <TouchableOpacity onPress={() => toggleFilter(option)}>
                                            <Text style={styles.filterItemText}>{option}</Text>
                                        </TouchableOpacity>
                                        {renderFilterControl(option)}
                                    </View>
                                ))}
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <FilteredViewer
                data={filteredData}
                visible={showFilteredViewer}
                onClose={() => setShowFilteredViewer(false)}
                activeTab={activeTab}
                caseType={caseType} 
                titleKey="title"
                filterKeys={['release_date', 'vote_average']}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#1B2631',
        borderRadius: 10,
        borderColor: '#888',
        borderWidth: 1,
        marginRight: 8,
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexDirection: 'row',
    },
    drawer: {
        width: screenWidth * 0.5,
        height: '100%',
        backgroundColor: '#2C3E50',
        padding: 20,
        paddingTop: 60,
        position: 'absolute',
        zIndex: 2,
    },
    drawerTitle: {
        color: '#fff',
        fontSize: 20,
        marginBottom: 20,
        fontWeight: 'bold',
    },
    filterItem: {
        paddingVertical: 10,
        borderBottomColor: '#555',
        borderBottomWidth: 1,
    },
    filterItemText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 5,
    },
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    genreButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderColor: '#888',
        borderWidth: 1,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
    },
    genreButtonSelected: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    genreText: {
        color: '#fff',
    },
    genreTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 8,
        paddingHorizontal: 10,
        color: '#fff',
        height: 40,
    },
    applyButton: {
        marginLeft: 10,
        backgroundColor: '#3498db',
        borderRadius: 8,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
