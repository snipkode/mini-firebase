#include "database.h"
#include <iostream>
#include <cstring>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <command> [args...]" << std::endl;
        std::cerr << "Commands:" << std::endl;
        std::cerr << "  init                    - Initialize database" << std::endl;
        std::cerr << "  insert <collection> <json> - Insert document" << std::endl;
        std::cerr << "  get <collection>        - Get all documents" << std::endl;
        std::cerr << "  query <collection> <field> <value> - Query documents" << std::endl;
        return 1;
    }
    
    MiniFirebase::Database db("../data");
    
    std::string command = argv[1];
    
    if (command == "init") {
        if (db.init()) {
            std::cout << "Database initialized successfully" << std::endl;
        } else {
            std::cerr << "Failed to initialize database" << std::endl;
            return 1;
        }
    }
    else if (command == "insert") {
        if (argc < 4) {
            std::cerr << "Usage: " << argv[0] << " insert <collection> <json>" << std::endl;
            return 1;
        }
        std::string collection = argv[2];
        std::string jsonData = argv[3];
        std::string docId = db.insert(collection, jsonData);
        std::cout << "{\"id\":\"" << docId << "\"}" << std::endl;
    }
    else if (command == "get") {
        if (argc < 3) {
            std::cerr << "Usage: " << argv[0] << " get <collection>" << std::endl;
            return 1;
        }
        std::string collection = argv[2];
        std::cout << db.get(collection) << std::endl;
    }
    else if (command == "query") {
        if (argc < 5) {
            std::cerr << "Usage: " << argv[0] << " query <collection> <field> <value>" << std::endl;
            return 1;
        }
        std::string collection = argv[2];
        std::string field = argv[3];
        std::string value = argv[4];
        std::cout << db.query(collection, field, value) << std::endl;
    }
    else {
        std::cerr << "Unknown command: " << command << std::endl;
        return 1;
    }
    
    return 0;
}
