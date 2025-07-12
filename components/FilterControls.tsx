import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    section: string;
    option: string;
    onApply: (filterType: string, filterValue: string) => void;
    isLoading: boolean;
}

const movieGenres = ['Action', 'Thriller', 'Comedy', 'Horror', 'Romance', 'Sci-Fi'];
const tvGenres = ['Action', 'Adventure', 'Comedy', 'Crime', 'Sci-Fi'];
const languages = ['English', 'Spanish', 'Bengali', 'Korean', 'Hindi'];
const networks = ['Netflix', 'HBO', 'Amazon Prime', 'Disney+', 'Hulu', 'CW'];

const bookCategories = {
    'Fiction & Literature': [
        'Fiction',
        'Literary Collections',
        'Romance',
        'Mystery & Detective',
        'Science Fiction',
        'Fantasy',
        'Historical Fiction',
        'Horror'
    ],
    'Non-Fiction': [
        'Biography & Autobiography',
        'Business & Economics',
        'Self-Help',
        'True Crime',
        'Religion',
        'Philosophy',
        'Political Science',
        'Psychology',
        'Education'
    ],
    'Children & Young Adult': [
        'Juvenile Fiction',
        'Juvenile Nonfiction',
        'Young Adult Fiction',
        'Young Adult Nonfiction'
    ],
    'Academic & Reference': [
        'Computers',
        'Mathematics',
        'Science',
        'Medical',
        'Technology & Engineering',
        'Law',
        'History'
    ]
    // 'Other Categories': [
    //     'Art',
    //     'Design',
    //     'Cooking',
    //     'Crafts & Hobbies',
    //     'Travel',
    //     'Health & Fitness',
    //     'Sports & Recreation',
    //     'Performing Arts',
    //     'Music',
    //     'Comics & Graphic Novels',
    //     'Games'
    // ]
};

export default function FilterControls({ section, option, onApply, isLoading }: Props) {
    const [releaseYear, setReleaseYear] = useState('');
    const [rating, setRating] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

    if (section === 'Movie' && (option === 'Genre' || option === 'Language')) {
        const isGenre = option === 'Genre';
        const items = isGenre ? movieGenres : languages;
        const selectedItem = isGenre ? selectedGenre : selectedLanguage;
        const setSelectedItem = isGenre ? setSelectedGenre : setSelectedLanguage;

        return (
            <View style={styles.genreContainer}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.genreButton, selectedItem === item && styles.genreButtonSelected]}
                        onPress={() => {
                            setSelectedItem(item);
                            onApply(option, item);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={[styles.genreText, selectedItem === item && styles.genreTextSelected]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    if (section === 'Movie' && (option === 'Release Year' || option === 'Rating Above')) {
        const value = option === 'Release Year' ? releaseYear : rating;
        const setValue = option === 'Release Year' ? setReleaseYear : setRating;
        const placeholder = option === 'Release Year' ? 'Enter year' : 'Enter rating (1-10)';

        return (
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={setValue}
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={[styles.applyButton, isLoading && styles.disabledButton]}
                    onPress={() => value && onApply(option, value)}
                    disabled={isLoading}
                >
                    {isLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.applyButtonText}>Apply</Text>}
                </TouchableOpacity>
            </View>
        );
    }

    if (section === 'TV Series') {
        if (option === 'Genre' || option === 'Language') {
            const isGenre = option === 'Genre';
            const items = isGenre ? tvGenres : languages;
            const [selectedItem, setSelectedItem] = isGenre ?
                [selectedGenre, setSelectedGenre] : [selectedLanguage, setSelectedLanguage];

            return (
                <View style={styles.genreContainer}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.genreButton, selectedItem === item && styles.genreButtonSelected]}
                            onPress={() => {
                                setSelectedItem(item);
                                onApply(option, item);
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.genreText, selectedItem === item && styles.genreTextSelected]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (option === 'Release Year') {
            return (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter year"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                        value={releaseYear}
                        onChangeText={setReleaseYear}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[styles.applyButton, isLoading && styles.disabledButton]}
                        onPress={() => releaseYear && onApply(option, releaseYear)}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.applyButtonText}>Apply</Text>}
                    </TouchableOpacity>
                </View>
            );
        }

        if (option === 'Network') {
            return (
                <View style={styles.genreContainer}>
                    {networks.map((network) => (
                        <TouchableOpacity
                            key={network}
                            style={[styles.genreButton, selectedNetwork === network && styles.genreButtonSelected]}
                            onPress={() => {
                                setSelectedNetwork(network);
                                onApply(option, network);
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.genreText, selectedNetwork === network && styles.genreTextSelected]}>
                                {network}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }
    }

    if (section === 'Book') {
        if (option === 'Genre') {
            return (
                <View style={styles.genreContainer}>
                    {Object.keys(bookCategories).map((category) => (
                        <React.Fragment key={category}>
                            <TouchableOpacity
                                style={styles.categoryHeader}
                                onPress={() => {
                                    setSelectedCategory(category);
                                    setSelectedSubcategory(null);
                                }}
                                disabled={isLoading}
                            >
                                <Text style={styles.categoryHeaderText}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                            
                            {selectedCategory === category && bookCategories[category as keyof typeof bookCategories].map((subcategory) => (
                                <TouchableOpacity
                                    key={subcategory}
                                    style={[styles.genreButton, selectedSubcategory === subcategory && styles.genreButtonSelected]}
                                    onPress={() => {
                                        setSelectedSubcategory(subcategory);
                                        onApply(option, subcategory);
                                    }}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.genreText, selectedSubcategory === subcategory && styles.genreTextSelected]}>
                                        {subcategory}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </React.Fragment>
                    ))}
                </View>
            );
        }
    }

    // Fallback to null if no matching filter handled
    return null;
}

const styles = StyleSheet.create({
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
        backgroundColor: 'transparent',
    },
    genreButtonSelected: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    genreText: {
        color: '#fff',
    },
    genreTextSelected: {
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
    disabledButton: {
        backgroundColor: '#888',
    },
    applyButtonText: {
        color: '#fff',
    },
    categoryHeader: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        marginBottom: 6,
    },
    categoryHeaderSelected: {
        borderBottomColor: '#3498db',
    },
    categoryHeaderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoryHeaderTextSelected: {
        color: '#3498db',
    },
});
