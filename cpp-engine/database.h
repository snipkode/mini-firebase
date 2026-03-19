#ifndef MINI_FIREBASE_DB_H
#define MINI_FIREBASE_DB_H

#include <string>
#include <vector>
#include <map>
#include <fstream>
#include <sstream>
#include <mutex>
#include <ctime>

namespace MiniFirebase {

class Database {
private:
    std::string dataDir;
    std::mutex dbMutex;
    
    std::string getCollectionPath(const std::string& collection) {
        return dataDir + "/" + collection + ".json";
    }
    
    std::string generateId() {
        return std::to_string(std::time(nullptr)) + "_" + 
               std::to_string(rand() % 10000);
    }
    
    std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \n\r\t");
        if (first == std::string::npos) return "";
        size_t last = str.find_last_not_of(" \n\r\t");
        return str.substr(first, last - first + 1);
    }
    
    std::vector<std::string> splitLines(const std::string& content) {
        std::vector<std::string> lines;
        std::stringstream ss(content);
        std::string line;
        while (std::getline(ss, line)) {
            if (!trim(line).empty()) {
                lines.push_back(trim(line));
            }
        }
        return lines;
    }

public:
    Database(const std::string& dir = "../data") : dataDir(dir) {
        srand(static_cast<unsigned>(std::time(nullptr)));
    }
    
    bool init() {
        std::ofstream test(dataDir + "/.init", std::ios::app);
        if (!test.is_open()) return false;
        test.close();
        return true;
    }
    
    std::string insert(const std::string& collection, const std::string& jsonData) {
        std::lock_guard<std::mutex> lock(dbMutex);
        
        std::string docId = generateId();
        std::string filePath = getCollectionPath(collection);
        
        std::string newDoc = "{\"id\":\"" + docId + "\"," + jsonData.substr(1);
        
        std::ifstream file(filePath);
        if (file.is_open()) {
            std::stringstream buffer;
            buffer << file.rdbuf();
            file.close();
            
            std::string content = trim(buffer.str());
            if (content.length() > 2) {
                content = content.substr(0, content.length() - 1) + "," + newDoc;
            } else {
                content = "[" + newDoc;
            }
            
            std::ofstream out(filePath);
            out << content;
            out.close();
        } else {
            std::ofstream out(filePath);
            out << "[" << newDoc;
            out.close();
        }
        
        return docId;
    }
    
    std::string get(const std::string& collection) {
        std::lock_guard<std::mutex> lock(dbMutex);
        
        std::string filePath = getCollectionPath(collection);
        std::ifstream file(filePath);
        
        if (!file.is_open()) {
            return "[]";
        }
        
        std::stringstream buffer;
        buffer << file.rdbuf();
        file.close();
        
        std::string content = trim(buffer.str());
        if (content.empty()) {
            return "[]";
        }
        
        return content + "]";
    }
    
    std::string query(const std::string& collection, const std::string& field, const std::string& value) {
        std::lock_guard<std::mutex> lock(dbMutex);
        
        std::string filePath = getCollectionPath(collection);
        std::ifstream file(filePath);
        
        if (!file.is_open()) {
            return "[]";
        }
        
        std::stringstream buffer;
        buffer << file.rdbuf();
        file.close();
        
        std::string content = buffer.str();
        std::string result = "[";
        bool first = true;
        
        size_t pos = 0;
        while ((pos = content.find("{", pos)) != std::string::npos) {
            size_t endPos = content.find("}", pos);
            if (endPos == std::string::npos) break;
            
            std::string doc = content.substr(pos, endPos - pos + 1);
            
            std::string searchPattern = "\"" + field + "\":\"" + value + "\"";
            std::string searchPatternNum = "\"" + field + "\":" + value;
            
            if (doc.find(searchPattern) != std::string::npos || 
                doc.find(searchPatternNum) != std::string::npos) {
                if (!first) result += ",";
                result += doc;
                first = false;
            }
            
            pos = endPos + 1;
        }
        
        return result + "]";
    }
};

}

extern "C" {
    void* db_create(const char* dataDir) {
        return new MiniFirebase::Database(dataDir);
    }
    
    void db_destroy(void* db) {
        delete static_cast<MiniFirebase::Database*>(db);
    }
    
    int db_init(void* db) {
        return static_cast<MiniFirebase::Database*>(db)->init() ? 1 : 0;
    }
    
    const char* db_insert(void* db, const char* collection, const char* jsonData) {
        std::string result = static_cast<MiniFirebase::Database*>(db)->insert(collection, jsonData);
        char* cstr = new char[result.length() + 1];
        strcpy(cstr, result.c_str());
        return cstr;
    }
    
    const char* db_get(void* db, const char* collection) {
        std::string result = static_cast<MiniFirebase::Database*>(db)->get(collection);
        char* cstr = new char[result.length() + 1];
        strcpy(cstr, result.c_str());
        return cstr;
    }
    
    const char* db_query(void* db, const char* collection, const char* field, const char* value) {
        std::string result = static_cast<MiniFirebase::Database*>(db)->query(collection, field, value);
        char* cstr = new char[result.length() + 1];
        strcpy(cstr, result.c_str());
        return cstr;
    }
    
    void db_free_string(const char* str) {
        delete[] str;
    }
}

#endif
