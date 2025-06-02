import {
    fetchFilteredMovies,
    fetchFilteredTVSeries,
    fetchLatestMovies,
    fetchLatestTVSeries,
    fetchTopRatedMovies,
    fetchTopRatedTVSeries,
    fetchUpcomingMovies,
    fetchUpcomingTVSeries
} from '@/services/tmdb_API';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import FilterControls from './FilterControls';
import FilteredViewer from './FilteredViewer';

const screenWidth = Dimensions.get('window').width;

const filterOptions: Record<string, string[]> = {
    Movie: ['Latest', 'Upcoming', 'Top Rated', 'Genre', 'Language', 'Release Year', 'Rating Above'],
    'TV Series': ['Latest', 'Upcoming', 'Top Rated', 'Genre', 'Network', 'Language', 'Release Year'],
    Music: ['Genre', 'Artist', 'Year'],
    Game: ['Genre', 'Platform', 'Publisher'],
    Book: ['Genre', 'Author', 'Year'],
};

interface DropdownProps {
    activeTab: string;
    onFilterSelect?: (filterType: string, filterValue: string) => void;
}

export default function Dropdown({ activeTab }: DropdownProps) {
    const [visible, setVisible] = useState(false);
    const [slideAnim] = useState(new Animated.Value(-screenWidth));
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
    const [filteredData, setFilteredData] = useState<any[] | null>(null);
    const [showFilteredViewer, setShowFilteredViewer] = useState(false);
    const [caseType, setCaseType] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

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

    const toggleFilter = async (option: string) => {
        const directFetchOptions = ['Latest', 'Upcoming', 'Top Rated'];

        if (directFetchOptions.includes(option)) {
            await handlePredefinedFetch(option);
        } else {
            setExpandedFilter(prev => (prev === option ? null : option));
        }
    };

    const handlePredefinedFetch = async (filterType: string) => {
        setIsLoading(true);
        const internalCaseType = filterType.toLowerCase().replace(/\s/g, '_');
        setCaseType(internalCaseType);

        try {
            let results: any[] = [];

            if (activeTab === 'Movie') {
                if (filterType === 'Latest') {
                    results = await fetchLatestMovies(10);
                    // Sort descending by release_date (latest first)
                    results.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
                } else if (filterType === 'Upcoming') {
                    results = await fetchUpcomingMovies(10);
                    // Sort ascending by release_date (soonest first)
                    results.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
                } else if (filterType === 'Top Rated') {
                    results = await fetchTopRatedMovies(10);
                    // Sort descending by vote_average (highest rated first)
                    results.sort((a, b) => b.vote_average - a.vote_average);
                }
            } else if (activeTab === 'TV Series') {
                if (filterType === 'Latest') {
                    results = await fetchLatestTVSeries(10);
                    // Sort descending by first_air_date
                    results.sort((a, b) => new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime());
                } else if (filterType === 'Upcoming') {
                    results = await fetchUpcomingTVSeries(10);
                    // Sort ascending by first_air_date
                    results.sort((a, b) => new Date(a.first_air_date).getTime() - new Date(b.first_air_date).getTime());
                } else if (filterType === 'Top Rated') {
                    results = await fetchTopRatedTVSeries(10);
                    // Sort descending by vote_average
                    results.sort((a, b) => b.vote_average - a.vote_average);
                }
            }
            results = Array.from(new Map(results.map(item => [item.id, item])).values());
            setFilteredData(results);
            setShowFilteredViewer(true);
            closeDrawer();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchFiltered = (filterType: string, filterValue: string) => {
        setIsLoading(true);
        const internalCaseType = filterType.toLowerCase().replace(/\s/g, '_');
        setCaseType(internalCaseType);

        const fetchFunction =
            activeTab === 'TV Series' ? fetchFilteredTVSeries : fetchFilteredMovies;

        fetchFunction(filterType, filterValue)
            .then(results => {
                results = Array.from(new Map(results.map(item => [item.id, item])).values());
                setFilteredData(results);
                setShowFilteredViewer(true);
                closeDrawer();
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
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
                        <TouchableWithoutFeedback>
                            <Animated.View style={[styles.drawer, { left: slideAnim }]}>
                                <Text style={styles.drawerTitle}>{activeTab} Filters</Text>

                                {options.map((option) => (
                                    <View key={option} style={styles.filterItem}>
                                        <TouchableOpacity
                                            onPress={() => toggleFilter(option)}
                                            disabled={isLoading}
                                        >
                                            <Text style={[
                                                styles.filterItemText,
                                                isLoading && styles.disabledText,
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>

                                        {expandedFilter === option && (
                                            <FilterControls
                                                section={activeTab}
                                                option={option}
                                                onApply={handleFetchFiltered}
                                                isLoading={isLoading}
                                            />
                                        )}
                                    </View>
                                ))}

                                {isLoading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#3498db" />
                                        <Text style={styles.loadingText}>Loading...</Text>
                                    </View>
                                )}
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
                titleKey={activeTab === 'TV Series' ? 'name' : 'title'}
                filterKeys={activeTab === 'TV Series' ? ['first_air_date', 'vote_average'] : ['release_date', 'vote_average']}
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
    loadingContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(44, 62, 80, 0.9)',
        borderRadius: 10,
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    disabledText: {
        color: '#aaa',
    }
});
