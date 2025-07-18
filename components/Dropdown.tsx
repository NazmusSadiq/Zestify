import { fetchFilteredGames } from '@/services/GameAPI';
import {
    getGenreContent,
    getImageUrl,
    type Album,
    type Artist,
    type GenreContent,
    type Track
} from "@/services/music_API";
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
import CategoryBooks from './CategoryBooks';
import FilterControls from './FilterControls';
import FilteredViewer from './FilteredViewer';
import GameFilteredViewer from './GameFilteredViewer';
import LikedShows from "./LikedShows";
import MusicDetailsViewer from "./MusicDetailsViewer";
import MusicGenre from "./MusicGenre";

const screenWidth = Dimensions.get('window').width;

const filterOptions: Record<string, string[]> = {
    Movie: ['Latest', 'Upcoming', 'Top Rated', 'Genre', 'Language', 'Release Year', 'Rating Above', 'Liked'],
    'TV Series': ['Latest', 'Upcoming', 'Top Rated', 'Genre', 'Network', 'Language', 'Release Year', 'Liked'],
    Music: ['Pop', 'Rock', 'Jazz', 'Hip-Hop', 'Electronic', 'Classical'],
    Game: ['Last 30 days', 'This week', 'Next week', 'Best of the year', 'Popular in 2024', 'Liked'],
    Book: ['Genre'],
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
    const [genreContent, setGenreContent] = useState<GenreContent | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<Artist | Album | Track | null>(null);
    const [itemType, setItemType] = useState<"artist" | "album" | "track" | null>(null);
    const [gameFilteredData, setGameFilteredData] = useState<any[] | null>(null);
    const [showGameFilteredViewer, setShowGameFilteredViewer] = useState(false);
    const [showCategoryBooks, setShowCategoryBooks] = useState(false);
    const [selectedBookCategory, setSelectedBookCategory] = useState<string>('');
    const [selectedBookSubcategory, setSelectedBookSubcategory] = useState<string>('');
    const [showLikedShows, setShowLikedShows] = useState(false);
    
    
    



    const handleMusicGenreSelect = async (genre: string) => {
      setIsLoading(true);
      setCaseType(genre.toLowerCase().replace(/\s/g, '_')); // optional
      try {
        setSelectedGenre(genre);
        const content = await getGenreContent(genre);
        if (content) {
          setGenreContent(content);
        }
        closeDrawer(); // Close after selecting
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };


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
        const directFetchOptions = ['Latest', 'Upcoming', 'Top Rated', 'Last 30 days', 'This week', 'Next week', 'Best of the year', 'Popular in 2024'];

        if (option === 'Liked' && (activeTab === 'Movie' || activeTab === 'TV Series')) {
            setShowLikedShows(true);
            closeDrawer();
            return;
        }

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

            if (activeTab === 'Game') {
                let ordering = '';
                switch (filterType) {
                    case 'Last 30 days':
                        ordering = '-released';
                        break;
                    case 'This week':
                        ordering = '-added';
                        break;
                    case 'Next week':
                        ordering = 'released';
                        break;
                    case 'Best of the year':
                        ordering = '-rating';
                        break;
                    case 'Popular in 2024':
                        ordering = '-metacritic';
                        break;
                }

                const response = await fetchFilteredGames({
                    ordering,
                    page_size: 20,
                });
                results = response.results;
                setGameFilteredData(results);
                setShowGameFilteredViewer(true);
            } else if (activeTab === 'Movie') {
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
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchFiltered = (filterType: string, filterValue: string) => {
        if (activeTab === 'Book' && filterType === 'Genre') {
            setSelectedBookCategory(filterType);
            setSelectedBookSubcategory(filterValue);
            setShowCategoryBooks(true);
            closeDrawer();
            return;
        }

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

    if (selectedItem) {
      return (
        <MusicDetailsViewer
          selectedItem={selectedItem}
          itemType={itemType}
          onClose={() => setSelectedItem(null)}
          getImageUrl={getImageUrl}
        />
      );
    }
    
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
                                            onPress={() => {
                                                if (activeTab === 'Music') {
                                                    handleMusicGenreSelect(option);
                                                } else {
                                                    toggleFilter(option);
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterItemText,
                                                    isLoading && styles.disabledText,
                                                ]}
                                            >
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        {expandedFilter === option &&
                                            activeTab !== 'Music' &&
                                            activeTab !== 'Game' && (
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

            {activeTab === 'Game' && (
                <GameFilteredViewer
                    data={gameFilteredData}
                    visible={showGameFilteredViewer}
                    onClose={() => setShowGameFilteredViewer(false)}
                />
            )}

            {activeTab !== 'Music' && activeTab !== 'Game' && (
                <FilteredViewer
                    data={filteredData}
                    visible={showFilteredViewer}
                    onClose={() => setShowFilteredViewer(false)}
                    activeTab={activeTab}
                    caseType={caseType}
                    titleKey={activeTab === 'TV Series' ? 'name' : 'title'}
                    filterKeys={
                        activeTab === 'TV Series'
                            ? ['first_air_date', 'vote_average']
                            : ['release_date', 'vote_average']
                    }
                />
            )}

            {/* LikedShows modal for Movie/TV Series */}
            {(activeTab === 'Movie' || activeTab === 'TV Series') && (
                <LikedShows
                    visible={showLikedShows}
                    onClose={() => setShowLikedShows(false)}
                    activeTab={activeTab as 'Movie' | 'TV Series'}
                />
            )}

            {activeTab === 'Music' && selectedGenre && genreContent && (
                <MusicGenre
                    genre={selectedGenre}
                    onBack={() => {
                        setSelectedGenre(null);
                        setGenreContent(null);
                    }}
                />
            )}

            {activeTab === 'Book' && (
                <CategoryBooks
                    category={selectedBookCategory}
                    subcategory={selectedBookSubcategory}
                    visible={showCategoryBooks}
                    onClose={() => {
                        setShowCategoryBooks(false);
                        setSelectedBookCategory('');
                        setSelectedBookSubcategory('');
                    }}
                />
            )}
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
    },
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
});
